const should         = require('should');
const File           = require('vinyl');
const es             = require('event-stream');
const fs             = require('fs');
const path           = require('path');
const globbingPlugin = require('../');

const createFile = (filePath, type) => {
    let contents;
    var filePath = path.join(__filename, '..', 'fixtures', filePath);

    if (type == 'stream') {
        contents = fs.createReadStream(filePath);
    } else {
        contents = fs.readFileSync(filePath);
    }

    return new File({
        path : filePath,
        cwd  : 'test/',
        base : 'test/fixtures',
        contents
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

    const globber = globbingPlugin(config);

    globber.write(file);
    globber.end();
    globber.once('data', cb);
};

describe('gulp-css-glob', () => {
    describe(`in buffer mode`, () => {
        it(`should leave non-glob @imports alone`, () => {
            _getGlobber('example.css', (file) => {
                file.isBuffer().should.be.true;

                String(file.contents).should.containEql(
                    '@import url(\'non-glob.css\');'
                );
            });
        });

        it(`should replace a url-style @import with single quotes`, () => {
            _getGlobber('example.css', (file) => {
                file.isBuffer().should.be.true;

                String(file.contents).should.containEql(
                    '@import url(\'single-quotes/1.css\');'
                );
                String(file.contents).should.containEql(
                    '@import url(\'single-quotes/2.css\');'
                );
            });
        });

        it(`should replace a url-style @import with double quotes`, () => {
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

        it(`should replace a url-style @import without quotes`, () => {
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

        it(`should only look for specified file extensions`, () => {
            _getGlobber('example.css', (file) => {
                file.isBuffer().should.be.true;

                String(file.contents).should.not.containEql(
                    '@import url(\'misc/textfile.txt\');'
                );
            });

            _getGlobber('example.css', { extensions: '.txt' }, (file) => {
                file.isBuffer().should.be.true;

                String(file.contents).should.containEql(
                    '@import url(\'misc/textfile.txt\');'
                );
                String(file.contents).should.not.containEql(
                    '@import url(\'single-quotes/1.css\');'
                );
            });
        });

        it(`should remove prefix-underscores and file extensions by default`, () => {
            const options          = {};
            options.extensions     = ['.scss'];
            options.scssImportPath = {
                leading_underscore : true,
                filename_extension : true
            };

            _getGlobber('example-import-path.scss', options, (file) => {
                file.isBuffer().should.be.true;

                String(file.contents).should.containEql(
                    '@import url(\'scss-import-path/_example.scss\');'
                );
                String(file.contents).should.containEql(
                    '@import url(\'scss-import-path/_example_2.scss\');'
                );
                String(file.contents).should.containEql(
                    '@import url(\'scss-import-path/__example_3.test.scss\');'
                );
                String(file.contents).should.containEql(
                    '@import url(\'scss-import-path/example_4_.test.css.scss\');'
                );
            });
        });

        it(`should set file extensions`, () => {
            const options          = {};
            options.scssImportPath = { filename_extension: true };
            options.extensions     = ['.scss'];

            _getGlobber('example-import-path.scss', options, (file) => {
                file.isBuffer().should.be.true;

                String(file.contents).should.containEql(
                    '@import url(\'scss-import-path/example.scss\');'
                );
                String(file.contents).should.containEql(
                    '@import url(\'scss-import-path/example_2.scss\');'
                );
                String(file.contents).should.containEql(
                    '@import url(\'scss-import-path/_example_3.test.scss\');'
                );
                String(file.contents).should.containEql(
                    '@import url(\'scss-import-path/example_4_.test.css.scss\');'
                );
            });
        });

        it(`should set prefix-underscores`, () => {
            const options          = {};
            options.scssImportPath = { leading_underscore: true };
            options.extensions     = ['.scss'];

            _getGlobber('example-import-path.scss', options, (file) => {
                file.isBuffer().should.be.true;

                String(file.contents).should.containEql(
                    '@import url(\'scss-import-path/_example\');'
                );
                String(file.contents).should.containEql(
                    '@import url(\'scss-import-path/_example_2\');'
                );
                String(file.contents).should.containEql(
                    '@import url(\'scss-import-path/__example_3.test\');'
                );
                String(file.contents).should.containEql(
                    '@import url(\'scss-import-path/example_4_.test.css\');'
                );
            });
        });

        it(`should replace a url-less @import in an scss file`, () => {
            _getGlobber('example.scss', { extensions: '.scss' }, (file) => {
                file.isBuffer().should.be.true;

                String(file.contents).should.containEql(
                    '@import \'scss-single-quotes/1\';'
                );
                String(file.contents).should.containEql(
                    '@import \'scss-single-quotes/2\';'
                );
                String(file.contents).should.containEql(
                    '@import "scss-double-quotes/1";'
                );
                String(file.contents).should.containEql(
                    '@import "scss-double-quotes/2";'
                );
            });
        });

        it(`should replace with a comment when no files are found`, () => {
            _getGlobber('example.css', (file) => {
                file.isBuffer().should.be.true;

                String(file.contents).should.containEql(
                    '/* No files to import found in non-existent//**//*.css */'
                );
            });
        });

        it(`should import if only one file matches the glob`, () => {
            _getGlobber('example-one.scss', { extensions: '.scss' }, (file) => {
                file.isBuffer().should.be.true;

                String(file.contents).should.eql('@import \'scss-one/1\';\n');
            });
        });

        it(`should import all files in sequence`, () => {
            _getGlobber('example-sequence.scss', { extensions: '.scss' }, (file) => {
                file.isBuffer().should.be.true;

                String(file.contents).should.eql(
                    [
                        '@import \'scss-sequence/1\';',
                        '@import \'scss-sequence/2\';',
                        '@import \'scss-sequence/3\';',
                        '@import \'scss-sequence/4\';',
                        '@import \'scss-sequence/5\';\n'
                    ].join('\n')
                );
            });
        });

        it(`should support sass syntax`, () => {
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

    describe(`in streaming mode`, () => {
        it(`should be supported`, () => {
            _getGlobber(createFile('example.css', 'stream'), (file) => {
                file.isStream().should.be.true;

                file.contents.pipe(es.wait((err, data) => {
                    should.not.exist(err);

                    String(data).should.containEql(
                        '@import url(\'single-quotes/1.css\');'
                    );
                    String(data).should.containEql(
                        '@import url(\'single-quotes/2.css\');'
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
                }));
            });
        });
    });
});
