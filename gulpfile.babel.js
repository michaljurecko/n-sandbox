/* global process */
import gulp from 'gulp';
import PrettyError from 'pretty-error';
import './build/gulp/tasks/php';
import './build/gulp/tasks/svg';
import './build/gulp/tasks/favicon';
import './build/gulp/tasks/scripts';
import './build/gulp/tasks/styles';
import './build/gulp/tasks/tests';
import './build/gulp/tasks/watch';
import './build/gulp/tasks/clean';
import './build/gulp/tasks/browsersync';

// Pretty error printing
new PrettyError().start();

// Throw unhandled promise rejection
process.on('unhandledRejection', (e) => { throw e; });


// ------------------------------------------------------------------------------------------
// TASK: lint
// ------------------------------------------------------------------------------------------
gulp.task('lint', gulp.series('lint-php', gulp.parallel('lint-scripts', 'lint-styles')));


// ------------------------------------------------------------------------------------------
// TASK: compile
// ------------------------------------------------------------------------------------------
gulp.task('compile', gulp.parallel('compile-scripts', 'compile-styles'));


// ------------------------------------------------------------------------------------------
// TASK: default
// ------------------------------------------------------------------------------------------
gulp.task('default', gulp.series(
  'clean',
  'lint-php',
  gulp.parallel('scripts', 'styles', 'favicon', 'icons'),
));


// ------------------------------------------------------------------------------------------
// TASK: serve
// ------------------------------------------------------------------------------------------
gulp.task('serve', gulp.series('default', gulp.parallel('php-server', 'browsersync', 'watch')));


// ------------------------------------------------------------------------------------------
// GIT HOOKS (defined in package.json)
// ------------------------------------------------------------------------------------------
gulp.task('pre-commit', gulp.series('lint', 'test'));
