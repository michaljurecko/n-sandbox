import log from 'fancy-log';
import PluginError from 'plugin-error';
import { spawn } from 'child_process';
import { gulp, onError } from '../plugins/errorHandler';
import config from '../config';

// ------------------------------------------------------------------------------------------
// TASK: ecs
// ------------------------------------------------------------------------------------------
gulp.task('ecs', (cb) => {
  log('Running PHP easy coding standard check');

  const args = [
    '-n', '-c', config.phpIni,
    'vendor/bin/ecs', 'check',
    '--config', config.phpecs,
  ];

  if (config.fix) {
    args.push('--fix');
  }

  args.push(...config.phpCheckDirs);

  spawn(config.phpBin, args, { stdio: 'inherit' })
    .on('exit', (code) => {
      if (code !== 0) {
        onError(new PluginError('ecs', 'There are some errors in PHP files.'));
      }
      cb();
    });
});


// ------------------------------------------------------------------------------------------
// TASK: phpstan
// ------------------------------------------------------------------------------------------
gulp.task('phpstan', (cb) => {
  log('Running PHP phpstan check');

  const args = [
    '-n', '-c', config.phpIni,
    'vendor/bin/phpstan', 'analyse',
    '--configuration', config.phpstan,
  ];

  args.push(...config.phpCheckDirs);

  spawn(config.phpBin, args, { stdio: 'inherit' })
    .on('exit', (code) => {
      if (code !== 0) {
        onError(new PluginError('phpstan', 'There are some errors in PHP files.'));
      }
      cb();
    });
});


// ------------------------------------------------------------------------------------------
// TASK: lint-php
// ------------------------------------------------------------------------------------------
gulp.task('lint-php', gulp.series('ecs', 'phpstan'));


// ------------------------------------------------------------------------------------------
// TASK: php-server
// ------------------------------------------------------------------------------------------
gulp.task('php-server', (cb) => {
  const job = spawn(
    config.phpBin,
    ['-n', '-c', config.phpIni, '-t', config.publicDir, '-S', config.phpListen],
  );

  // Catch PHP server stderr
  const stderr = [];
  job.stderr.on('data', data => stderr.push(data.toString()));
  job.on('exit', (code) => {
    if (code !== 0) {
      stderr.slice(-5).forEach(s => log('php-server:', s.trim()));
      onError(new PluginError('php-server', 'An unexpected error while running PHP server.'));
      process.exit(1);
    }
    cb();
  });

  // Kill PHP server on Gulp exit
  process.on('exit', () => { job.kill('SIGKILL'); });
});
