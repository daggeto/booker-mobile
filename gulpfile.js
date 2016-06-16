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

var paths = {
  sass: ['./src/sass/**/*.scss'],
  coffee: ['./src/coffee/**/*.coffee'],
  slim: ['./src/slim/**/*.slim'],
};

var coffee_paths = {
  root: ['./src/coffee/*.coffee'],
  controllers: ['./src/coffee/controllers/*.coffee'],
  services: ['./src/coffee/services/*.coffee'],
  resources: ['./src/coffee/resources/*.coffee']
}

gulp.task('default', ['sass', 'coffee', 'slim']);

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
  gulp.src(coffee_paths.root)
    .pipe(coffee({bare: true})
    .on('error', gutil.log.bind(gutil, 'Coffee Error')))
    .pipe(gulp.dest('./www/js'))

  gulp.src(coffee_paths.controllers)
    .pipe(coffee({bare: true})
    .on('error', gutil.log.bind(gutil, 'Coffee Error')))
    .pipe(concat('controllers.js'))
    .pipe(gulp.dest('./www/js'))

  gulp.src(coffee_paths.services)
    .pipe(coffee({bare: true})
    .on('error', gutil.log.bind(gutil, 'Coffee Error')))
    .pipe(concat('services.js'))
    .pipe(gulp.dest('./www/js'))

  gulp.src(coffee_paths.resources)
    .pipe(coffee({bare: true})
    .on('error', gutil.log.bind(gutil, 'Coffee Error')))
    .pipe(concat('resources.js'))
    .pipe(gulp.dest('./www/js'))
    .on('end', done)
});

gulp.task('slim', function(done){
  gulp.src("./src/slim/**/*.slim")
    .pipe(changed("./www", {extension: '.html'}))
    .pipe(slim({pretty: true, options: "attr_list_delims={'(' => ')', '[' => ']'}"}))
    .pipe(gulp.dest("./www"))
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

gulp.task('git-check', function(done) {
  if (!sh.which('git')) {
    console.log(
      '  ' + gutil.colors.red('Git is not installed.'),
      '\n  Git, the version control system, is required to download Ionic.',
      '\n  Download git here:', gutil.colors.cyan('http://git-scm.com/downloads') + '.',
      '\n  Once git is installed, run \'' + gutil.colors.cyan('gulp install') + '\' again.'
    );
    process.exit(1);
  }
  done();
});
