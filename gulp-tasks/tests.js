var gulp = require('gulp');
var gutil = require('gulp-util');
var coffee = require('gulp-coffee');

var testsPaths = {
  coffeeTests: './specs/specs-coffee/**/*.coffee'
};

var destPaths = {
  tests: './specs/specs-js'
}

gulp.task('compile-tests', function(done) {
  gulp.src(testsPaths.coffeeTests)
    .pipe(coffee({bare: true})
      .on('error', gutil.log.bind(gutil, 'Coffee Error')))
    .pipe(gulp.dest(destPaths.tests))
    .on('end', done)
});

gulp.task('build-tests', ['compile-tests']);

gulp.task('watch-tests', function() {
  gulp.watch(testsPaths.coffeeTests, ['build-tests']);
});
