# gulp-css-glob [![Build Status][travis-image]][travis-url]
> A Gulp plugin for globbing CSS `@import` statements

Expands CSS `@import` statements containing globs with the full paths. Useful with pre-processors like Sass.

## Install

Install `gulp-css-glob` as a development dependency using npm:

```shell
yarn add gulp-css-glob --dev
```

## Usage

```js
const cssGlobbing = require('gulp-css-globbing');

gulp.task('css', () => {
    gulp.src(['src/styles.css'])
        .pipe(cssGlobbing())
        .pipe(gulp.dest('build/styles.css'));
});
```

Given a CSS file that looks like this:

```css
@import url('components/*.css');

body {
      background: white;
}
```

The plugin would produce the following:

```css
@import url('components/flex-embed.css');
@import url('components/media.css');

body {
      background: white;
}
```

Globbing is relative to the source file's path.


## Options

`gulp-css-globbing` can be called with an options object:

```js
gulp.task('css', function(){
    gulp.src(['src/styles.css'])
        .pipe(cssGlobbing({
            extensions     : ['.css', '.scss'],
            scssImportPath : {
                leading_underscore : false,
                filename_extension : false
            }
        }))
        .pipe(gulp.dest('build/styles.css'));
});
```

### extensions
Type: `String` or `Array`

The file extensions to treat as valid imported files. If files are found that match the glob, but its extensions don't match this option, they will not be added to the resulting file.

Default: `['.css']`

### scssImportPath
Type: `Object`

Allows for [default scss rules for writing scss import paths](https://github.com/causes/scss-lint/blob/master/lib/scss_lint/linter/README.md#importpath).

Default:
```
{
  leading_underscore: true, // underscores will NOT be removed
  filename_extension: true // extensions will NOT be removed
}
```

#### Leading Underscore

If `leading_underscore` is set to `false`, then the *first* leading underscore of a file name will be removed. Example: `.../main/_main.scss` becomes `@import '../main/main.scss';`

#### Filename Extension

If `filename_extension` is set to `false`, then the the extension of a file name will be removed. Example: `.../main/_main.scss` becomes `@import '../main/_main';`



[travis-url]: https://travis-ci.org/Donov4n/gulp-css-glob
[travis-image]: https://travis-ci.org/Donov4n/gulp-css-glob.svg?branch=master
