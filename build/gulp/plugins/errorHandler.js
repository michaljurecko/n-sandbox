/* global process */
import gulp from 'gulp';
import plumber from 'gulp-plumber';
import minimist from 'minimist';
import notify from './notify';

function onError(e) {
  const args = minimist(process.argv.slice(2));
  const task = args._[0];
  notify.notify(e.plugin || 'Gulp', e.message, 'error');

  // Ignore errors in watch and serve tasks
  if (['serve', 'watch'].includes(task)) {
    if (this && this.emit) {
      this.emit('end');
    }
  } else {
    process.exit(1);
  }
}


// gulp.src error handler
const gulpSrc = gulp.src;
gulp.src = (...args) =>
  gulpSrc.apply(gulp, args).pipe(plumber(onError));


export { onError, gulp };
