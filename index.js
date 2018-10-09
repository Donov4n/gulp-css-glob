'use strict';

var gutil = require('gulp-util');
var glob  = require('glob');
var map   = require('vinyl-map');
var path  = require('path');

// Constants
var PLUGIN_NAME = 'gulp-css-globbing';

var cssGlobbingPlugin = function(options) {
    if (!options) {
        options = {};
    }
    if (!options.extensions) {
        options.extensions = ['.css', '.scss'];
    }

    var scssImportPathDefaults = {
        leading_underscore : false,
        filename_extension : false
    };

    if (typeof options.extensions == 'string') {
        options.extensions = [options.extensions];
    }
    if (!(options.extensions instanceof Array)) {
        throw new gutil.PluginError(PLUGIN_NAME, 'extensions needs to be a string or an array');
    }

    if (options.scssImportPath && !(options.scssImportPath instanceof Object)) {
        throw new gutil.PluginError(PLUGIN_NAME, 'SCSS import path needs to be an object');
    }
    options.scssImportPath = Object.assign({}, scssImportPathDefaults, options.scssImportPath);

    return map(function(code, filename) {
        var content      = code.toString();
        var semicolon    = path.extname(filename).indexOf('.sass') !== -1 ? '' : ';';
        var importRegExp = /^\s*@import\s+((?:url\()?["']?)?([^"'\)]+)(['"]?(?:\))?)?;?\s*$/gm;
        var globRegExp   = /\/\*/;

        var files;
        content = content.replace(importRegExp, function(result, prefix, filePattern, suffix) {
            files = [];

            if (globRegExp.exec(filePattern)) {
                glob.sync(filePattern, { cwd: path.dirname(filename) }).forEach(
                    function(foundFilePath) {
                        if (options.extensions.indexOf(path.extname(foundFilePath)) !== -1) {
                            var foundFilename = path.basename(foundFilePath);
                            var foundFileDirname = path.dirname(foundFilePath);

                            if (!options.scssImportPath.filename_extension) {
                                foundFilename = path.basename(foundFilename, path.extname(foundFilename));
                            }

                            if (!options.scssImportPath.leading_underscore) {
                                foundFilename = foundFilename.replace(/^_/, '');
                            }

                            foundFilePath = path
                                .join(foundFileDirname, foundFilename)
                                .replace(new RegExp('\\' + path.sep, 'g'), '/');

                            files.push(foundFilePath);
                        }
                    }
                );

                if (files.length) {
                    result = '';
                    files.forEach(function(foundFilePath) {
                        result += '@import ' + prefix + foundFilePath + suffix + semicolon + '\n';
                    });
                } else {
                    result = '/* No files to import found in ' + filePattern.replace(/\//g, '//') + ' */';
                }
            }

            return result;
        });

        return content;
    });
};

module.exports = cssGlobbingPlugin;
