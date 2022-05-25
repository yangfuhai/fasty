var gulp = require('gulp');
var header = require('gulp-header');
var uglify = require("gulp-uglify");
var rename = require('gulp-rename');
var pkg = require('./package.json');

var comment = '/*\n' +
    ' * <%= pkg.name %> <%= pkg.version %>\n' +
    ' * <%= pkg.description %>\n' +
    ' * <%= pkg.homepage %>\n' +
    ' *\n' +
    ' * Copyright 2022, <%= pkg.author %>\n' +
    ' * Released under the <%= pkg.license %> license.\n' +
    '*/\n';

gulp.task('js-minify', function () {
    return gulp.src('fasty.js')
        .pipe(uglify({}))
        .pipe(header(comment, {
            pkg: pkg
        }))
        .pipe(rename('fasty.min.js'))
        .pipe(gulp.dest('./'));
});



gulp.task('default', gulp.series([
    'js-minify',
    // 'js-concat',
    // 'css-minify'
]));
