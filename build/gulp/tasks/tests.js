import log from 'fancy-log';
import PluginError from 'plugin-error';
import { spawn } from 'child_process';
import { gulp, onError } from '../plugins/errorHandler';
import config from '../config';

// ------------------------------------------------------------------------------------------
// TASK: test
// ------------------------------------------------------------------------------------------
gulp.task('test', (cb) => {
  log('Running Nette tester');

  spawn('vendor/bin/tester', ['tests', '-p', 'php', '-c', config.phpIni], { stdio: 'inherit' })
    .on('exit', (code) => {
      if (code !== 0) { onError(new PluginError('test', 'Tests failed!')); }
      cb();
    });
});
