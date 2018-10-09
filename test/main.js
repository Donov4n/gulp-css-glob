var globbingPlugin = require('../');
var should = require('should');
var File = require('vinyl');
var es = require('event-stream');
var fs = require('fs');
var path = require('path');

var createFile = (filePath, type) => {
    var contents;
    var filePath = path.join(__filename, '..', 'fixtures', filePath);

    if (type == 'stream') {
        contents = fs.createReadStream(filePath);
    } else {
        contents = fs.readFileSync(filePath);
    }

    return new File({
        path     : filePath,
        cwd      : 'test/',
        base     : 'test/fixtures',
        contents : contents
    });
};

const _getGlobber = (file, config = {}, cb = null) => {
    if (typeof config === 'function') {
        cb     = config;
        config = {};
    }

    if (!(file instanceof File)) {
        file = createFile(file);
    }

    var globber = globbingPlugin(config);

    globber.write(file);
    globber.end();

    globber.once('data', cb);

    return globber;
};

describe('gulp-css-globbing', function() {
    describe('in buffer mode', function() {
        it('should leave non-glob @imports alone', function() {
            _getGlobber('example.css', (file) => {
                file.isBuffer().should.be.true;

                String(file.contents).should.containEql(
                    "@import url('non-glob.css');"
                );
            });
        });

        it('should replace a url-style @import with single quotes', function() {
            _getGlobber('example.css', (file) => {
                file.isBuffer().should.be.true;

                String(file.contents).should.containEql(
                    "@import url('single-quotes/1.css');"
                );
                String(file.contents).should.containEql(
                    "@import url('single-quotes/2.css');"
                );
            });
        });

        it('should replace a url-style @import with double quotes', function() {
            _getGlobber('example.css', (file) => {
                file.isBuffer().should.be.true;

                String(file.contents).should.containEql(
                    '@import url("double-quotes/1.css");'
                );
                String(file.contents).should.containEql(
                    '@import url("double-quotes/2.css");'
                );
            });
        });

        it('should replace a url-style @import without quotes', function() {
            _getGlobber('example.css', (file) => {
                file.isBuffer().should.be.true;

                String(file.contents).should.containEql(
                    '@import url(without-quotes/1.css);'
                );
                String(file.contents).should.containEql(
                    '@import url(without-quotes/2.css);'
                );
            });
        });

        it('should only look for specified file extensions', function() {
            _getGlobber('example.css', (file) => {
                file.isBuffer().should.be.true;

                String(file.contents).should.not.containEql(
                    "@import url('misc/textfile.txt');"
                );
            });

            _getGlobber('example.css', { extensions: '.txt' }, (file) => {
                file.isBuffer().should.be.true;

                String(file.contents).should.containEql(
                    "@import url('misc/textfile.txt');"
                );
                String(file.contents).should.not.containEql(
                    "@import url('single-quotes/1.css');"
                );
            });
        });

        it('should not remove file extensions or prefix-underscores by default', function() {
            _getGlobber('example-import-path.scss', { extensions: ['.scss'] }, (file) => {
                file.isBuffer().should.be.true;

                String(file.contents).should.containEql(
                    "@import url('scss-import-path/_example.scss');"
                );
                String(file.contents).should.containEql(
                    "@import url('scss-import-path/_example_2.scss');"
                );
                String(file.contents).should.containEql(
                    "@import url('scss-import-path/__example_3.test.scss');"
                );
                String(file.contents).should.containEql(
                    "@import url('scss-import-path/example_4_.test.css.scss');"
                );
            });
        });

        it('should set file extensions', function() {
            const options          = {};
            options.scssImportPath = { filename_extension: true };
            options.extensions     = ['.scss'];

            _getGlobber('example-import-path.scss', options, (file) => {
                file.isBuffer().should.be.true;

                String(file.contents).should.containEql(
                    "@import url('scss-import-path/example.scss');"
                );
                String(file.contents).should.containEql(
                    "@import url('scss-import-path/example_2.scss');"
                );
                String(file.contents).should.containEql(
                    "@import url('scss-import-path/_example_3.test.scss');"
                );
                String(file.contents).should.containEql(
                    "@import url('scss-import-path/example_4_.test.css.scss');"
                );
            });
        });

        it('should set prefix-underscores', function() {
            const options          = {};
            options.scssImportPath = { leading_underscore: true };
            options.extensions     = ['.scss'];

            _getGlobber('example-import-path.scss', options, (file) => {
                file.isBuffer().should.be.true;

                String(file.contents).should.containEql(
                    "@import url('scss-import-path/_example');"
                );
                String(file.contents).should.containEql(
                    "@import url('scss-import-path/_example_2');"
                );
                String(file.contents).should.containEql(
                    "@import url('scss-import-path/__example_3.test');"
                );
                String(file.contents).should.containEql(
                    "@import url('scss-import-path/example_4_.test.css');"
                );
            });
        });

        it('should set prefix-underscores and set file extensions', function() {
            const options          = {};
            options.extensions     = ['.scss'];
            options.scssImportPath = {
                leading_underscore : true,
                filename_extension : true
            };

            _getGlobber('example-import-path.scss', options, (file) => {
                file.isBuffer().should.be.true;

                String(file.contents).should.containEql(
                    "@import url('scss-import-path/_example.scss');"
                );
                String(file.contents).should.containEql(
                    "@import url('scss-import-path/_example_2.scss');"
                );
                String(file.contents).should.containEql(
                    "@import url('scss-import-path/__example_3.test.scss');"
                );
                String(file.contents).should.containEql(
                    "@import url('scss-import-path/example_4_.test.css.scss');"
                );
            });
        });

        it('should not run auto-replace unless it is turned on ', function() {
            _getGlobber('example-auto-replace.scss', (file) => {
                file.isBuffer().should.be.true;

                String(file.contents).should.containEql('// on/off test text');
            });
        });

        it('should replace a url-less @import in an scss file', function() {
            _getGlobber('example.scss', { extensions: '.scss' }, (file) => {
                file.isBuffer().should.be.true;

                String(file.contents).should.containEql(
                    "@import 'scss-single-quotes/1.scss';"
                );
                String(file.contents).should.containEql(
                    "@import 'scss-single-quotes/2.scss';"
                );
                String(file.contents).should.containEql(
                    '@import "scss-double-quotes/1.scss";'
                );
                String(file.contents).should.containEql(
                    '@import "scss-double-quotes/2.scss";'
                );
            });
        });

        it('should replace with a comment when no files are found', function() {
            _getGlobber('example.scss', (file) => {
                file.isBuffer().should.be.true;

                String(file.contents).should.containEql(
                    '/* No files to import found in non-existent//**//*.css */'
                );
            });
        });

        it('should import if only one file matches the glob', function() {
            _getGlobber('example-one.scss', { extensions: '.scss' }, (file) => {
                file.isBuffer().should.be.true;

                String(file.contents).should.eql("@import 'scss-one/1';\n");
            });
        });

        it('should import all files in sequence', function() {
            _getGlobber('example-sequence.scss', { extensions: '.scss' }, (file) => {
                file.isBuffer().should.be.true;

                String(file.contents).should.eql(
                    [
                        "@import 'scss-sequence/1';",
                        "@import 'scss-sequence/2';",
                        "@import 'scss-sequence/3';",
                        "@import 'scss-sequence/4';",
                        "@import 'scss-sequence/5';\n"
                    ].join("\n")
                );
            });
        });

        it('should support sass syntax', function() {
            const options = {
                extensions     : '.sass',
                scssImportPath : {
                    filename_extension: true
                }
            };

            _getGlobber('example.sass', options, (file) => {
                file.isBuffer().should.be.true;

                String(file.contents).should.eql('@import "sass/1.sass"\n');
            });
        });
    });

    describe('in streaming mode', function() {
        it('should be supported', function() {
            _getGlobber(createFile('example.css', 'stream'), (file) => {
                file.isStream().should.be.true;

                file.contents.pipe(
                    es.wait(function(err, data) {
                        should.not.exist(err);

                        String(data).should.containEql(
                            "@import url('single-quotes/1.css');"
                        );
                        String(data).should.containEql(
                            "@import url('single-quotes/2.css');"
                        );
                        String(data).should.containEql(
                            '@import url("double-quotes/1.css");'
                        );
                        String(data).should.containEql(
                            '@import url("double-quotes/2.css");'
                        );
                        String(data).should.containEql(
                            '@import url(without-quotes/1.css);'
                        );
                        String(data).should.containEql(
                            '@import url(without-quotes/2.css);'
                        );
                    })
                );
            });
        });
    });
});
