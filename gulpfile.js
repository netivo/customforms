var gulp = require('gulp');

var jshint = require('gulp-jshint');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var minifyCss = require('gulp-clean-css');
var sass = require('gulp-sass');

var projectName = 'jquery.custom-forms';

gulp.task('main-css', function(){
    return gulp.src('src/sass/main.scss')
        .pipe(sass({includePaths: ['src/sass']}).on('error', sass.logError))
        .pipe(rename(projectName + '.css'))
        .pipe(gulp.dest('dist/css'))
        .pipe(rename(projectName + '.min.css'))
        .pipe(minifyCss())
        .pipe(gulp.dest('dist/css'));
});
gulp.task('main-js', function(){
    return gulp.src('src/js/**/*.js')
        .pipe(concat(projectName+'.js'))
        .pipe(gulp.dest('dist/js'))
        .pipe(rename(projectName+'.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('dist/js'));
});

gulp.task('watch-main-css', function(){
    return gulp.watch('src/sass/**/*.scss', ['main-css']);
});
gulp.task('watch-main-js', function(){
    return gulp.watch('src/js/**/*.js', ['main-js']);
});
gulp.task('watch', ['watch-main-css', 'watch-main-js']);