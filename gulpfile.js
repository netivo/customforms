let gulp = require('gulp');
let gulplog = require('gulplog');
let concat = require('gulp-concat');
let uglify = require('gulp-uglify');
let rename = require('gulp-rename');
let minifyCss = require('gulp-clean-css');
let sass = require('gulp-sass');

const compileSass = function () {
    return gulp.src('src/sass/main.scss')
        .pipe(sass({includePaths: ['src/sass']}).on('error', gulplog.error))
        .pipe(rename('jquery.customforms.css'))
        .pipe(gulp.dest('dist/css'))
        .pipe(rename('jquery.customforms.min.css'))
        .pipe(minifyCss())
        .pipe(gulp.dest('dist/css'));
};

const compileJavascript = function() {
    return gulp.src('src/js/**/*.js')
        .pipe(concat('jquery.customforms.js'))
        .pipe(gulp.dest('dist/js'))
        .pipe(rename('jquery.customforms.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('dist/js'));
};

const developSass = function(){
    return gulp.watch('src/sass/**/*.scss', compileSass);
};

const developJavascript = function () {
    return gulp.watch('src/js/**/*.js', compileJavascript);
};

exports.develop = gulp.parallel(developSass, developJavascript);
exports.compile = gulp.parallel(compileSass, compileJavascript);