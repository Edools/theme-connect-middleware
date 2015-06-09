var gulp      = require('gulp'),
    $         = require('gulp-load-plugins')(),
    esperanto = require('esperanto'),
    path      = require('path');

function linkTask(path) {
  return function () {
    return gulp.src(path)
      .pipe($.eslint())
      .pipe($.eslint.format())
      .pipe($.eslint.failOnError());
  }
}

gulp.task('lint:src', linkTask('src/**/*.js'));
gulp.task('lint:test', linkTask('test/**/*.js'));

gulp.task('build', ['lint:src'], function (done) {
  esperanto.bundle({
    base: 'src',
    entry: 'index'
  }).then(function (bundle) {
    var res = bundle.toUmd({
      sourceMap: true,
      sourceMapSource: 'index.js',
      sourceMapFile: 'index.js',
      name: 'index.js',
      strict: true
    });

    var exportFileName = path.basename('src/index.js', path.extname('src/index.js')) + '.js';

    $.file(exportFileName, res.code, { src: true })
      .pipe($.sourcemaps.init({ loadMaps: true }))
      .pipe($.babel({ blacklist: ['useStrict'] }))
      .pipe($.sourcemaps.write('./', { addComment: false }))
      .pipe(gulp.dest('dist/'))
      .on('end', done);
  })
  .catch(done);
});

gulp.task('serve', ['build'], function () {
  gulp.watch('src/**/*.js', ['build']);
});
