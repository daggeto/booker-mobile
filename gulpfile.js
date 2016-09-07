var gulp = require('gulp');
var gutil = require('gulp-util');
var bower = require('bower');
var concat = require('gulp-concat');
var sass = require('gulp-sass');
var minifyCss = require('gulp-minify-css');
var rename = require('gulp-rename');
var changed = require('gulp-changed');
var ngAnnotate = require('gulp-ng-annotate');
var sh = require('shelljs');
var coffee = require('gulp-coffee');
var slim = require("gulp-slim");
var inject = require('gulp-inject');
var del = require('del');
var gulpSequence = require('gulp-sequence');
var uglify = require('gulp-uglify');
var pump = require('pump');

var paths = {
  sass: ['./src/sass/**/*.scss'],
  coffee: ['./src/coffee/**/*.coffee'],
  slim: ['./src/slim/**/*.slim'],
};

gulp.task('clean', function(done){
  del(['./www/js/**/*']);
  del(['./www/templates/**/*.html']);
  del(['./www/index.html']);

  done()
});

gulp.task('sass', function(done) {
  gulp.src('./src/sass/*.scss')
    .pipe(sass())
    .on('error', sass.logError)
    .pipe(gulp.dest('./www/css/'))
    .pipe(minifyCss({
      keepSpecialComments: 0
    }))
    .pipe(rename({ extname: '.min.css' }))
    .pipe(gulp.dest('./www/css/'))
    .on('end', done);
});

gulp.task('coffee', function(done) {
  gulp.src(paths.coffee)
    .pipe(coffee({bare: true})
    .on('error', gutil.log.bind(gutil, 'Coffee Error')))
    .pipe(gulp.dest('./www/js'))
    .on('end', done)
});

gulp.task('prod-coffee', function(done){
  pump([
      gulp.src(paths.coffee),
      coffee({bare: true}),
      concat('script.js'),
      gulp.dest('./www/js/')
    ],
    done
  );
});

gulp.task('slim', function(done){
  gulp.src("./src/slim/**/*.slim")
    .pipe(changed("./www", {extension: '.html'}))
    .pipe(slim({pretty: true, options: "attr_list_delims={'(' => ')', '[' => ']'}"}))
    .pipe(gulp.dest("./www"))
    .on('end', done);
});

gulp.task('inject-scripts', function (done) {
  var sources = gulp.src(['./www/js/**/*.js'], {read: false});

  gulp.src('./www/index.html')
    .pipe(inject(sources,{relative: true}))
    .pipe(gulp.dest('./www'))
    .on('end', done);
});

gulp.task('watch', function() {
  gulp.watch(paths.sass, ['sass'])
  gulp.watch(paths.coffee, ['coffee'])
  gulp.watch(paths.slim, ['slim'])
});

gulp.task('install', ['git-check'], function() {
  return bower.commands.install()
    .on('log', function(data) {
      gutil.log('bower', gutil.colors.cyan(data.id), data.message);
    });
});

gulp.task('default', ['sass', 'coffee', 'slim']);
gulp.task('index', gulpSequence('default', 'inject-scripts'));
gulp.task('prod', gulpSequence('clean', 'prod-coffee', 'slim','inject-scripts'))
