/*
 * Copyright © 2016 I.B.M. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the “License”);
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an “AS IS” BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

(function() {
    var gulp = require('gulp');
    var $ = require('gulp-load-plugins')({
        pattern: ['gulp-*', 'gulp.*'],
        replaceString: /\bgulp[\-.]/
    });
    var appDev = './ui/';
    var appProd = './dist/';

    gulp.task('build-ibm', function() {
        return gulp.src(appDev + 'ibm/*.js')
            .pipe(gulp.dest(appProd + 'ibm'));
    });

    gulp.task('build-css', ['build-fonts'], function() {
        return gulp.src(appDev + 'css/*.css')
            .pipe($.cleanCss())
            .pipe(gulp.dest(appProd + 'css/'))
            .pipe($.size({ 'title': 'css' }));
    });

    gulp.task('build-fonts', function() {
        return gulp.src([appDev + 'fonts/**'])
//            .pipe($.fontmin())
            .pipe(gulp.dest(appProd + 'fonts'));
    });

    gulp.task('build-html', ['build-img', 'build-css', 'build-ibm'], function() {
        var assets = $.useref({ 'searchPath': ['ui/**/*.*', 'node_modules'] });
        return gulp.src(appDev + 'index.html')
            .pipe(assets) //node_modules dir is in the current dir, search there for dependencies!
            .pipe($.sourcemaps.init({ 'identityMap': true, 'debug': true }))
            .pipe($.useref())
            // TODO re-add with caching 
            //.pipe(sourcemaps.write('./maps'))
            // Commenting out lines that don't work with latest version of Node
            // .pipe($.if('*.js', $.if('**/dashboard.min.js', $.uglify({mangle: false, preserveComments: 'license'}), $.uglify())))
            // .pipe($.if('*.css', $.cleanCss()))
            .pipe(gulp.dest(appProd))
            .pipe($.size({ 'title': 'html' }));
    });

    gulp.task('build-img', function() {
        return gulp.src(appDev + 'images/**/*')
          // TODO re-add with caching
//            .pipe($.if('*.png', $.imagemin()))
            .pipe(gulp.dest(appProd + 'images/'));
    });

    gulp.task('clean', function() {
        return gulp.src(appProd, { read: false })
            .pipe($.clean());
    });

    gulp.task('watch', ['build-html'], function() {
        gulp.watch(appDev + '**/*.js', ['build-html']);
        gulp.watch(appDev + 'css/*.css', ['build-html']);
        gulp.watch(appDev + '**/*.html', ['build-html']);
        gulp.watch(appDev + 'images/**/*', ['build-html']);
    });

    gulp.task('server:start', function() {
        $.developServer.listen({ path: './server.js' });
    });

    gulp.task('server:watch', ['build-html', 'server:start', 'watch']);

    gulp.task('default', ['build-html']);
}());
