import browsersync from 'browser-sync';
import { gulp } from '../plugins/errorHandler';
import config from '../config';

// ------------------------------------------------------------------------------------------
// TASK: watch
// ------------------------------------------------------------------------------------------
gulp.task('watch', () => {
  gulp.watch(config.phpGlobs, gulp.series('lint-php'));
  gulp.watch(config.sassGlobs, gulp.series('styles'));
  gulp.watch(config.scriptsGlobs, gulp.series('scripts'));
  gulp.watch(config.translationsGlobs, gulp.series('scripts'));
  gulp.watch(config.faviconPath, gulp.series('favicon'));

  // Browsersync reload, timeout prevents repeated reloads in a short time
  let reloadTimeout = null;
  gulp.watch([`${config.publicDir}/**/*`] + config.browsersync.watch).on('all', () => {
    clearTimeout(reloadTimeout);
    reloadTimeout = setTimeout(() => {
      browsersync.reload();
    }, 500);
  });
});
