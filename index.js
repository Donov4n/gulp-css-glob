'use strict';

const PluginError = require('plugin-error');
const glob        = require('glob');
const map         = require('vinyl-map');
const path        = require('path');

// Constants
const PLUGIN_NAME = 'gulp-css-globbing';

const _normalizeOptions = (options) => {
    if (!options) {
        options = {};
    }
    const _options = Object.assign({}, options);

    if (!_options.extensions) {
        _options.extensions = ['.css', '.scss'];
    }
    if (typeof _options.extensions === 'string') {
        _options.extensions = [_options.extensions];
    }
    if (!(_options.extensions instanceof Array)) {
        throw new PluginError(PLUGIN_NAME, `Extensions needs to be a string or an array`);
    }

    if (_options.scssImportPath && !(_options.scssImportPath instanceof Object)) {
        throw new PluginError(PLUGIN_NAME, `SCSS import path needs to be an object`);
    }
    _options.scssImportPath = Object.assign(
        { leading_underscore: false, filename_extension: false },
        _options.scssImportPath
    );

    return _options;
};

const cssGlobbingPlugin = function (options) {
    options = _normalizeOptions(options);

    return map((code, filename) => {
        const extension      = path.extname(filename);
        const isImporterSass = ['.scss', '.sass'].includes(extension);
        const semicolon      = extension.indexOf('.sass') !== -1 ? '' : ';';
        const importRegExp   = /^\s*@import\s+((?:url\()?["']?)?([^"'\)]+)(['"]?(?:\))?)?;?\s*$/gm;
        const globRegExp     = /\/\*/;

        return code.toString().replace(importRegExp, (result, prefix, filePattern, suffix) => {
            const files = [];

            if (globRegExp.exec(filePattern)) {
                glob.sync(filePattern, { cwd: path.dirname(filename) }).forEach(
                    (foundFilePath) => {
                        const foundFileExt = path.extname(foundFilePath);

                        if (options.extensions.includes(foundFileExt)) {
                            let foundFilename      = path.basename(foundFilePath);
                            const foundFileDirname = path.dirname(foundFilePath);

                            if (isImporterSass) {
                                if (
                                    !options.scssImportPath.filename_extension &&
                                    ['.scss', '.sass'].includes(foundFileExt)
                                ) {
                                    foundFilename = path.basename(foundFilename, foundFileExt);
                                }

                                if (!options.scssImportPath.leading_underscore) {
                                    foundFilename = foundFilename.replace(/^_/, '');
                                }
                            }

                            foundFilePath = path
                                .join(foundFileDirname, foundFilename)
                                .replace(new RegExp(`\\${path.sep}`, 'g'), '/');

                            files.push(foundFilePath);
                        }
                    }
                );

                if (files.length) {
                    result = '';
                    files.forEach((foundFilePath) => {
                        result += `@import ${prefix}${foundFilePath}${suffix}${semicolon}\n`;
                    });
                } else {
                    result = `/* No files to import found in ${filePattern.replace(/\//g, '//')} */`;
                }
            }

            return result;
        });
    });
};

module.exports = cssGlobbingPlugin;
