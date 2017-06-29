'use strict';

var gulp = require('gulp');
//var browserSync = require('browser-sync').create();  

var concatCss = require('gulp-concat-css'); // соединяет всё файлы стилей css в один с учётом правила @import в определённом порядке
var concat = require('gulp-concat'); // соединяет всё файлы в заданном порядке
var minifyCss = require('gulp-minify-css'); // минификация css-файлов
var rename = require("gulp-rename"); // переименовывание файла
var notify = require("gulp-notify"); // уведомление об изменениях в файле
var autoprefixer = require('gulp-autoprefixer'); //автоматически добавляет вендорные префиксы к CSS свойствам
var del = require('del'); // удаляет директорию
var uglify = require('gulp-uglify'); // сжимает js код
var fixmyjs = require("gulp-fixmyjs"); // автоматически исправляет простые ошибки в коде после линта выполненного на основе JSHint (gulp-jshint)
var jshint = require('gulp-jshint'); // проверка кода JavaScript

gulp.task('html', function () {
    return gulp.src('src/*.html')
               .pipe(gulp.dest('build/'))
               .pipe(notify("Done HTML!"));
});

// очищаем директорию перед записью
gulp.task('clean', function() {
    return del('build/css');    
});

gulp.task('css', function() {
  return gulp.src('src/css/main.css')
             .pipe(concatCss('styles.css'))
             .pipe(autoprefixer({
			      browsers: ['last 5 versions'],
			      cascade: false
		      }))
             .pipe(minifyCss())
             .pipe(rename('styles.min.css'))
             .pipe(gulp.dest('build/css/'))
             .pipe(notify("Done CSS!"));
});

gulp.task('build:css', ['clean', 'css']);

// явно указываем порядок соединения файлов
gulp.task('js', function() {
  return gulp.src(['src/js/currentPosition.js'])
             .pipe(concat('script.js'))
             .pipe(jshint())
             .pipe(jshint.reporter('default'))
             .pipe(fixmyjs())
             //.pipe(uglify())
             .pipe(rename('script.min.js'))
             .pipe(gulp.dest('build/js/'))
             .pipe(notify("Done JavaScript!"));
});

// наблюдаем за изменениями в файлах
gulp.task('watch', function() {
    gulp.watch('src/*.html', ['html']);
    gulp.watch('src/css/*.css', ['build:css']);  
    gulp.watch('src/js/*.js', ['js']);
});

// запуск Browsersync и слежение за файлами
/*gulp.task('browser-sync',  function() {
    browserSync.init({
        server: 'build'
    });
    browserSync.watch('build/**/    //*.*').on('change', browserSync.reload);
//});

// запуск всей сборки
//gulp.task('default', [ 'browser-sync', 'watch']);
gulp.task('default', [ 'watch']);