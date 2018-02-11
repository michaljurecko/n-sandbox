import browsersync from 'browser-sync';
import { gulp } from '../plugins/errorHandler';
import config from '../config';

// ------------------------------------------------------------------------------------------
// TASK: browsersync - run browsersync and proxy PHP server
// ------------------------------------------------------------------------------------------
gulp.task('browsersync', () => {
  browsersync({
    proxy: {
      target: config.phpListen,
      proxyOptions: { changeOrigin: false },
      ws: true,
    },
    port: config.browsersync.port,
    reloadDelay: 300,
    reloadOnRestart: true,
    logFileChanges: false,
    open: false,
  });
});
