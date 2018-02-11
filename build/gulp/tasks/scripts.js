import uglify from 'gulp-uglify-es/lib/index';
import merge from 'merge2';
import concat from 'gulp-concat';
import filter from 'gulp-filter';
import eslint from 'gulp-eslint';
import sourcemaps from 'gulp-sourcemaps';
import through from 'through2';
import rollup from 'gulp-better-rollup';
import rollupNodeResolve from 'rollup-plugin-node-resolve';
import rollupBabel from 'rollup-plugin-babel';
import rollupCommonjs from 'rollup-plugin-commonjs';
import { gulp } from '../plugins/errorHandler';
import localization from '../plugins/localization';
import packageJson from '../../../package.json';
import manifest from '../plugins/manifest';
import config from '../config';

// ------------------------------------------------------------------------------------------
// Merge scripts to one gulp stream
// Input can by PATH or STREAM FACTORY
// ------------------------------------------------------------------------------------------
function mergeScripts(inputs) {
  const streams = (Array.isArray(inputs) ? inputs : [inputs]).map((input) => {
    const item = typeof input === 'function' ? input() : input;
    return typeof item === 'string' ? gulp.src(item, { base: './' }) : item;
  });

  return merge(...streams)
    .pipe(config.sourcemaps ? sourcemaps.init({ loadMaps: true }) : through.obj());
}

// ------------------------------------------------------------------------------------------
// Compile script with rollup and babel
// ------------------------------------------------------------------------------------------
function rollupScript(entrypoint) {
  // Add 'modules: false' to all babel presets from package.json, it's required by rollup
  const presets = packageJson.babel.presets.map(preset =>
    (preset instanceof Array && preset[1] && typeof preset[1] === 'object' ?
      [preset[0], Object.assign({ modules: false }, preset[1])] :
      [preset, { modules: false }]));

  // Compile script using rollup and babel
  return gulp.src(entrypoint, { base: './' })
    .pipe(config.sourcemaps ? sourcemaps.init({ loadMaps: true }) : through.obj())
    .pipe(rollup({
      context: 'window',
      plugins: [
        rollupBabel({ presets, babelrc: false, plugins: ['external-helpers'] }),
        rollupNodeResolve({ jsnext: true, browser: true }),
        rollupCommonjs({ include: 'node_modules/**' }),
      ],
    }, { format: 'es' }));
}

// ------------------------------------------------------------------------------------------
// TASK: compile scripts
// ------------------------------------------------------------------------------------------
gulp.task('compile-scripts', (cb) => {
  const scripts = merge(Object.keys(config.scripts).map((output) => {
    const options = Object.assign({
      // Default options
      compress: config.compressJs,
      mangle: config.mangleJs,
    }, config.scripts[output]);

    const streams = [];
    // Add vendor scripts
    if (options.libs) {
      streams.push(mergeScripts(options.libs));
    }

    // Add application script
    if (options.entrypoint) {
      streams.push(rollupScript(options.entrypoint).pipe(localization.extract()));
    }

    // Compress and mangle
    return merge(...streams)
      .pipe(concat('scripts.js'))
      .pipe(options.compress ? uglify({ mangle: options.mangle }) : through.obj())
      .pipe(manifest.dest(output));
  }));

  scripts.on('finish', () => localization.write(cb));
});


// ------------------------------------------------------------------------------------------
// TASK: lint scripts
// ------------------------------------------------------------------------------------------
gulp.task('lint-scripts', () =>
  gulp.src(config.scriptsGlobs, { base: './' })
    .pipe(eslint({ configFile: config.esLintConfig, fix: config.fix }))
    .pipe(eslint.format())
    .pipe(eslint.failAfterError())
    .pipe(filter(f => f.eslint && f.eslint.output)) // filter fixed files
    .pipe(config.fix ? gulp.dest('.') : through.obj())); // write fixed files


// ------------------------------------------------------------------------------------------
// TASK: scripts
// ------------------------------------------------------------------------------------------
gulp.task('scripts', gulp.series('lint-scripts', 'compile-scripts'));
