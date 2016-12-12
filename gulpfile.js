var gulp = require('gulp');
var gutil = require('gulp-util');
var bower = require('bower');
var concat = require('gulp-concat');
var sass = require('gulp-sass');
var minifyCss = require('gulp-minify-css');
var rename = require('gulp-rename');
var changed = require('gulp-changed');
var coffee = require('gulp-coffee');
var slim = require("gulp-slim");
var inject = require('gulp-inject');
var del = require('del');
var gulpSequence = require('gulp-sequence');
var uglify = require('gulp-uglify');
var pump = require('pump');
var templateCache = require('gulp-angular-templatecache');
var ngAnnotate = require('gulp-ng-annotate');
var flatten = require('gulp-flatten');
var replace = require('gulp-replace-task');
var args  = require('yargs').argv;
var fs = require('fs');
var YAML = require('yamljs');
var requireDir = require('require-dir');


var paths = {
  sass: ['./src/sass/**/*.scss'],
  coffee: ['./src/coffee/**/*.coffee'],
  slim: ['./src/slim/**/*.slim'],
  translations: ['./translations/*.yaml']
};

gulp.task('clean', function(done){
  del(['.www/css/**/*']);
  del(['./www/js/**/*']);
  del('./www/templates/**/*.html');
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

gulp.task('ng_annotate', function (done) {
  gulp.src('./www/js/**/*.js')
    .pipe(ngAnnotate({single_quotes: true}))
    .pipe(gulp.dest('./www/js/'))
    .on('end', done);
});

gulp.task('move_lib', function (done){
  gulp.src('./src/lib/**/*')
    .pipe(gulp.dest('./www/lib/'))
    .on('end', done);
});

gulp.task('inject_scripts', function (done) {
  var sources = gulp.src(['./www/js/**/*.js'], {read: false});

  gulp.src('./www/index.html')
    .pipe(inject(sources,{relative: true}))
    .pipe(gulp.dest('./www'))
    .on('end', done);
});

// Development
gulp.task('default', gulpSequence('compile_dev', 'inject_scripts'));

gulp.task('compile_dev', function(done) {
  gulpSequence(['sass', 'js', 'slim', 'move_lib'], done)
});

gulp.task('js', function(done){
  gulpSequence('coffee', 'ng_annotate', done)
});

gulp.task('coffee', function(done) {
  gulp.src(paths.coffee)
    .pipe(replaceParams())
    .pipe(coffee({bare: true})
    .on('error', gutil.log.bind(gutil, 'Coffee Error')))
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
  gulp.watch(paths.coffee, ['js'])
  gulp.watch(paths.translations, ['js'])
  gulp.watch(paths.slim, ['slim'])
});

// Production
gulp.task('prod', gulpSequence('compile_prod','ng_annotate' , 'slim_index', 'inject_scripts'));

gulp.task('compile_prod', function(done){
  gulpSequence(['clean', 'sass', 'slim_cache', 'coffee_prod', 'move_lib'], done)
});

gulp.task('slim_cache', function (done) {
  gulp.src(paths.slim)
    .pipe(slim({pretty: true, options: "attr_list_delims={'(' => ')', '[' => ']'}"}))
    .pipe(templateCache({standalone:true}))
    .pipe(gulp.dest('./www/js'))
    .on('end', done);
});

gulp.task('coffee_prod', function(done){
    gulp.src(paths.coffee)
      .pipe(replaceParams())
      .pipe(coffee({bare: true}))
      .on('error', gutil.log.bind(gutil, 'Coffee Error'))
      .pipe(concat('script.js'))
      .pipe(gulp.dest('./www/js/'))
      .on('end', done)
});

gulp.task('slim_index', function (done) {
  gulp.src('./src/slim/index.slim')
    .pipe(slim({pretty: true, options: "attr_list_delims={'(' => ')', '[' => ']'}"}))
    .pipe(gulp.dest("./www"))
    .on('end', done);
});

function replaceParams() {
  var settings = getSettings();

  var translations = getTranslations(settings.locale);

  return replace({
    patterns: [
      {
        match: 'templates',
        replacement: settings.templates
      },
      {
        match: 'api_url',
        replacement: settings.apiUrl
      },
      {
        match: 'locale',
        replacement: settings.locale
      },
      {
        match: 'translations',
        replacement: translations
      }
    ]
  })
}

var getSettings = function (){
  var env = args.env || 'dev';

  var filename = env + '.json';
  return JSON.parse(fs.readFileSync('./config/' + filename, 'utf8'));
};

var getTranslations = function (locale) {
  return YAML.load('./translations/' + locale + '.yaml');
};

requireDir('./gulp-tasks');
