'use strict';

const through = require('through2');
const from    = require('new-from');
const bl      = require('bl');

const map = (fn) => {
    let done    = false;
    let pending = 0;

    const check = (stream) => {
        if (pending || !done) {
            return;
        }

        process.nextTick(() => {
            stream.emit('end');
            process.nextTick(() => {
                stream.emit('close');
            });
        });
    };

    const write = function (file, _, next) {
        const stream = this;
        const _push  = (_file) => {
            stream.push(_file);
            next();
        };

        const _map = (_file, contents) => {
            _file = _file.clone();
            if (typeof contents === 'undefined') {
                contents = _file.contents;
            }

            let mapped;
            try {
                mapped = fn(contents, _file.path);
            } catch (err) {
                stream.emit('error', err);
                return;
            }

            if (mapped === undefined) {
                mapped = contents;
            }

            if (_file.isBuffer()) {
                _file.contents = Buffer.from(mapped);
            }
            if (_file.isStream()) {
                _file.contents = from([mapped]);
            }

            _push(_file);
        };

        if (typeof file !== 'object') {
            return;
        }

        if (!('contents' in file) || file.isNull()) {
            _push(file);
            return;
        }

        if (file.isBuffer()) {
            _map(file);
            return;
        }

        // should be a stream by this point...
        pending += 1;
        file.contents.pipe(
            bl((err, result) => {
                if (err) {
                    stream.emit('error', err);
                    return;
                }

                _map(file, result);
                pending -= 1;
                check(this);
            })
        );
    };

    const flush = function () {
        done = true;
        check(this);
    };

    return through.obj(write, flush);
};

module.exports = map;
