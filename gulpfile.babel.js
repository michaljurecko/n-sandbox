/* global Buffer */
/* global process */
/* eslint-env node */
/* eslint no-console: 'off' */
/* eslint no-use-before-define: 'off' */
/* eslint import/extensions: 'off' */

import gulp from 'gulp';
import util from 'gulp-util';
import clone from 'gulp-clone';
import plumber from 'gulp-plumber';
import concat from 'gulp-concat';
import rename from 'gulp-simple-rename';
import filter from 'gulp-filter';
import rev from 'gulp-rev';
import revFormat from 'gulp-rev-format';
import sass from 'gulp-sass';
import sassLint from 'gulp-sass-lint';
import sassTildaImporter from 'node-sass-tilde-importer';
import postcss from 'gulp-postcss';
import cssnano from 'cssnano';
import autoprefixer from 'autoprefixer';
import sourcemaps from 'gulp-sourcemaps';
import size from 'gulp-size';
import nittro from 'gulp-nittro';
import uglify from 'gulp-uglify-es';
import rollup from 'gulp-better-rollup';
import rollupBabel from 'rollup-plugin-babel';
import rollupNodeResolve from 'rollup-plugin-node-resolve';
import rollupCommonjs from 'rollup-plugin-commonjs';
import eslint from 'gulp-eslint';
import * as esprima from 'esprima';
import esprimaUtils from 'esprima-ast-utils';
import neon from 'neon-js/src/neon';
import semaphore from 'stream-semaphore';
import { spawn } from 'child_process';
import browsersync from 'browser-sync';
import notifier from 'node-notifier';
import svgSprite from 'gulp-svg-sprite';
import svg2png from 'svg2png';
import svgo from 'gulp-svgmin';
import mustache from 'mustache';
import toIco from 'to-ico';
import { PassThrough } from 'stream';
import combiner from 'stream-combiner2';
import through from 'through2';
import merge from 'merge2';
import flat from 'flat';
import path from 'path';
import fs from 'fs';
import del from 'del';
import packageJson from './package.json';

process.on('unhandledRejection', (e) => { throw e; });

// ------------------------------------------------------------------------------------------
// Configuration, see https://github.com/webrouse/n-sandbox/wiki/Gulp#configuration
// ------------------------------------------------------------------------------------------

// Use --production flag to enable production mode
const production = !!util.env.production;

// Nittro builder: https://github.com/nittro/nittro
const nittroBuilder = new nittro.Builder({
  base: {
    core: true,
    datetime: false,
    neon: false,
    di: true,
    ajax: true,
    forms: true,
    page: true,
    flashes: true,
    routing: true,
  },
  extras: {
    checklist: false,
    dialogs: false,
    confirm: false,
    dropzone: false,
    paginator: false,
    keymap: false,
    storage: false,
  },
  bootstrap: false,
  stack: false,
});

// Build config
const config = {
  // Paths
  publicDir: 'www',
  buildDir: 'build',
  manifest: 'manifest.json',

  // Global options
  fix: !!util.env.fix, // Fix coding standard issues?
  compressJs: production,
  mangleJs: production,
  compressCss: production,
  sourcemaps: !production,

  // Styles
  //   Options:
  //    * compress: compress output (override global config.compressCss)
  //    * autoprefixer: process output with Autoprefixer (default true)
  //    * entrypoint: entrypoint for SASS compiler
  styles: {
    'css/app.css': {
      entrypoint: 'resources/styles/main.scss',
    },
  },

  // Styles lint
  sassGlobs: ['resources/styles/**/*.{sass,scss,css}'],
  sassLintConfig: 'resources/styles/.sass-lint.yml',

  // Scripts
  //   Options:
  //     * compress: compress output (override global config.compressJs)
  //     * mangle: mangle output (override global config.mangleJs)
  //     * libs: libraries, one is defined as path or stream factory
  //     * entrypoint: Rollup entrypoint script
  //  *** Note: 'libs' output is added before Rollup 'entrypoint' output if both are used.
  scripts: {
    'js/app.js': {
      mangle: false, // Nittro depends on names
      libs: [
        () => nittro('js', nittroBuilder), // Nittro js stream factory
        './node_modules/bazinga-translator/public/js/translator.min.js',
      ],
      entrypoint: 'resources/scripts/bootstrap.js',
    },
  },

  // Scripts lint
  scriptsGlobs: ['gulpfile.babel.js', 'resources/scripts/**/*.{es,js}'],
  esLintConfig: 'resources/scripts/.eslintrc.yml',

  // SVG icons
  iconsGlobs: ['./node_modules/mdi-svg/svg/*.svg'],
  iconsOutput: 'icons/*',
  iconsList: ['information-outline', 'check', 'alert-outline', 'alert-circle-outline'],

  // SASS function template for inline SVG icons in CSS
  iconsSassTemplate: 'resources/styles/vendor/icons/_icons.scss.tmpl',

  // Favicon
  faviconPath: './resources/graphic/favicon.svg',
  faviconOutput: 'icons/*',

  // Translation
  translationsGlobs: 'resources/translations/*/*.*.neon',
  translationsOutput: 'js/translations/*',
  translatorVars: ['translator', 't'],

  // PHP
  phpBin: 'php',
  phpIni: 'php.ini',
  phpListen: '127.0.0.1:8000',
  phpGlobs: ['app/**/*.php', 'tests/**/*.php'],

  // PHP coding standards
  phpDirsForCheck: ['app', 'tests'],
  phpstan: 'phpstan.neon',
  phpecs: 'coding-standard.neon',

  // Browsersync
  browsersyncPort: 3000,
};

// Browsersync watch paths
config.browsersyncWatch = [`${config.publicDir}/**`, 'app/**/*.{php,neon,latte}', config.translationsGlobs];

// ------------------------------------------------------------------------------------------
// TASK: compile styles
// ------------------------------------------------------------------------------------------
gulp.task('compile-styles', () =>
  merge(Object.keys(config.styles).map((output) => {
    const options = Object.assign({
      compress: config.compressCss,
      icons: false,
      autoprefixer: true,
    }, config.styles[output]);

    // PostCSS plugins
    const plugins = [];
    if (options.autoprefixer) { plugins.push(autoprefixer()); }
    if (options.compress) { plugins.push(cssnano()); }

    // Custom functions
    const functions = {
      // Encode string to base64
      'encodeBase64($str)': $str =>
        sass.compiler.types.String(Buffer.from($str.getValue()).toString('base64')),
      // Encode data URI
      'encodeDataURI($str)': ($str) => {
        const m = [[/%0A/g, ''], [/%20/g, ' '], [/%3D/g, '='], [/%3A/g, ':'], [/%2F/g, '/'], [/%22/g, "'"]];
        const out = encodeURIComponent($str.getValue());
        return sass.compiler.types.String(m.reduce((o, i) => o.replace(i[0], i[1]), out));
      },
      // Set SVG fill color (<svg fill="COLOR">...</svg>)
      'svgFill($svg, $color)': ($svg, $color) =>
        sass.compiler.types.String($svg.getValue()
          .replace(
            /^(<svg[^>]+)(>.*)(<\/svg>)$/i,
            ($0, start, center, end) => `${start} fill="${$color.getValue()}"${center}${end}`,
          )),
      // Set SVG stroke color (<svg stroke="COLOR">...</svg>)
      'svgStroke($svg, $color)': ($svg, $color) =>
        sass.compiler.types.String($svg.getValue()
          .replace(
            /^(<svg[^>]+)(>.*)(<\/svg>)$/i,
            ($0, start, center, end) => `${start} stroke="${$color.getValue()}"${center}${end}`,
          )),
      // Handle warning
      '@warn': (warning) => {
        notify('gulp-sass', `${warning.getValue()}`, 'warning');
        return sass.compiler.NULL;
      },
    };

    // SASS & PostCSS
    return merge(inlineSvgSass(), gulp.src(options.entrypoint))
      .pipe(plumber(onError))
      .pipe(config.sourcemaps ? sourcemaps.init({ loadMaps: true }) : util.noop())
      .pipe(concat('styles.scss'))
      .pipe(sass({ outputStyle: 'compact', importer: sassTildaImporter, functions }))
      .pipe(postcss(plugins))
      .pipe(storeRev(output));
  })));
// ------------------------------------------------------------------------------------------
// TASK: compile scripts
// ------------------------------------------------------------------------------------------
gulp.task('compile-scripts', (cb) => {
  const localization = new LocalizationPlugin();
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
      .pipe(options.compress ? uglify({ mangle: options.mangle }) : util.noop())
      .pipe(storeRev(output));
  }));

  scripts.on('finish', () => localization.write(cb));
});

// ------------------------------------------------------------------------------------------
// TASK: lint styles
// ------------------------------------------------------------------------------------------
gulp.task('lint-styles', () =>
  gulp.src(config.sassGlobs, { base: './' })
    .pipe(plumber(onError))
    .pipe(sassLint({ configFile: config.sassLintConfig }))
    .pipe(sassLint.format())
    .pipe(sassLint.failOnError()));

// ------------------------------------------------------------------------------------------
// TASK: lint scripts
// ------------------------------------------------------------------------------------------
gulp.task('lint-scripts', () =>
  gulp.src(config.scriptsGlobs, { base: './' })
    .pipe(plumber(onError))
    .pipe(eslint({ configFile: config.esLintConfig, fix: config.fix }))
    .pipe(eslint.format())
    .pipe(eslint.failAfterError())
    .pipe(filter(f => f.eslint && f.eslint.output)) // filter fixed files
    .pipe(config.fix ? gulp.dest('.') : util.noop())); // write fixed files

// ------------------------------------------------------------------------------------------
// TASK: lint php
// ------------------------------------------------------------------------------------------
gulp.task('ecs', (cb) => {
  util.log('Running PHP easy coding standard check');

  const args = [
    '-n', '-c', config.phpIni,
    'vendor/bin/ecs', 'check',
    '--config', config.phpecs,
  ];

  if (config.fix) {
    args.push('--fix');
  }

  args.push(...config.phpDirsForCheck);

  spawn(config.phpBin, args, { stdio: 'inherit' })
    .on('exit', (code) => {
      if (code !== 0) {
        onError(new util.PluginError('ecs', 'There are some errors in PHP files.'));
      }
      cb();
    });
});

gulp.task('phpstan', (cb) => {
  util.log('Running PHP phpstan check');

  const args = [
    '-n', '-c', config.phpIni,
    'vendor/bin/phpstan', 'analyse',
    '--configuration', config.phpstan,
  ];

  args.push(...config.phpDirsForCheck);

  spawn(config.phpBin, args, { stdio: 'inherit' })
    .on('exit', (code) => {
      if (code !== 0) {
        onError(new util.PluginError('phpstan', 'There are some errors in PHP files.'));
      }
      cb();
    });
});

gulp.task('lint-php', gulp.series('ecs', 'phpstan'));

// ------------------------------------------------------------------------------------------
// TASK: styles
// ------------------------------------------------------------------------------------------
gulp.task('styles', gulp.series('lint-styles', 'compile-styles'));

// ------------------------------------------------------------------------------------------
// TASK: scripts
// ------------------------------------------------------------------------------------------
gulp.task('scripts', gulp.series('lint-scripts', 'compile-scripts'));

// ------------------------------------------------------------------------------------------
// TASK: lint
// ------------------------------------------------------------------------------------------
gulp.task('lint', gulp.series('lint-php', gulp.parallel('lint-scripts', 'lint-styles')));

// ------------------------------------------------------------------------------------------
// TASK: icon
// ------------------------------------------------------------------------------------------
// Combine icons to SVG sprite in <symbol> format
gulp.task('icons', () =>
  svgIcons()
    .pipe(svgSprite({
      mode: { symbol: { sprite: 'symbols.svg', dest: '' } },
      svg: {
        xmlDeclaration: false,
        doctypeDeclaration: false,
        rootAttributes: {
          'aria-hidden': 'true', style: 'display: none;', // hide symbol definitions in HTML file
        },
      },
    }))
    .pipe(storeRev(config.iconsOutput)));

// ------------------------------------------------------------------------------------------
// TASK: favicon
// ------------------------------------------------------------------------------------------
gulp.task('favicon', () => {
  const stream = gulp.src(config.faviconPath)
    .pipe(plumber(onError))
    .pipe(through.obj(function (svg, _, cb) {
      Promise.all([
        // Create favicon.ico: 16x16 + 32x32 + 48x48 + 64x64
        Promise.all([16, 32, 48, 64].map(s => svg2png(svg.contents, { width: s, height: s })))
          .then(pngImages => toIco(pngImages))
          .then(buffer => this.push(new util.File({ path: 'favicon.ico', contents: buffer }))),
        // Create favicon.png: 256x256
        svg2png(svg.contents, { width: 256, height: 256 })
          .then(buffer => this.push(new util.File({ path: 'favicon.png', contents: buffer }))),
        // Create apple.png: 180x180
        svg2png(svg.contents, { width: 180, height: 180 })
          .then(buffer => this.push(new util.File({ path: 'apple.png', contents: buffer }))),
      ])
        .then(() => cb(null))
        .catch(error => cb(error));
    }));

  return merge(
    // Write icons to build dir
    stream.pipe(storeRev(config.faviconOutput)),
    // Write favicon.ico to public dir for compatibility reasons
    stream
      .pipe(filter(file => file.path === 'favicon.ico'))
      .pipe(gulp.dest(`${config.publicDir}`))
      .pipe(size({ showFiles: true, showAll: false })),
  );
});

// ------------------------------------------------------------------------------------------
// TASK: test
// ------------------------------------------------------------------------------------------
gulp.task('test', (cb) => {
  util.log('Running Nette tester');

  spawn('vendor/bin/tester', ['tests', '-p', 'php', '-c', config.phpIni], { stdio: 'inherit' })
    .on('exit', (code) => {
      if (code !== 0) { onError(new util.PluginError('test', 'Tests failed!')); }
      cb();
    });
});

// ------------------------------------------------------------------------------------------
// TASK: clean
// ------------------------------------------------------------------------------------------
gulp.task('clean', () => del([
  '!**/.*', // ignore files starting with dot
  'temp/**/*',
  '!temp/sessions',
  `${config.publicDir}/${config.buildDir}/**/*`,
  `${config.publicDir}/favicon.ico`,
]));

// ------------------------------------------------------------------------------------------
// TASK: default
// ------------------------------------------------------------------------------------------
gulp.task('default', gulp.series(
  'clean',
  'lint-php',
  gulp.parallel('scripts', 'styles', 'favicon', 'icons'),
));

// ------------------------------------------------------------------------------------------
// TASK: serve-php
// ------------------------------------------------------------------------------------------
gulp.task('serve-php', gulp.series('default', (cb) => {
  phpServer(cb);
  watch();
}));

// Run PHP server
function phpServer(cb) {
  const job = spawn(
    config.phpBin,
    ['-n', '-c', config.phpIni, '-t', config.publicDir, '-S', config.phpListen],
  );

  // Catch PHP server stderr
  const stderr = [];
  job.stderr.on('data', data => stderr.push(data.toString()));
  job.on('exit', (code) => {
    if (code !== 0) {
      stderr.slice(-5).forEach(s => util.log('php-server:', s.trim()));
      onError(new util.PluginError('php-server', 'An unexpected error while running PHP server.'));
      process.exit(1);
    }
    cb();
  });

  // PHP server shutdown
  process.on('exit', () => {
    job.kill('SIGKILL');
  });
}

// ------------------------------------------------------------------------------------------
// TASK: serve
// ------------------------------------------------------------------------------------------
gulp.task('serve', gulp.series('default', (cb) => {
  phpServer(cb);

  // Run browsersync and proxy PHP server
  browsersync({
    proxy: {
      target: config.phpListen,
      proxyOptions: { changeOrigin: false },
      ws: true,
    },
    port: config.browsersyncPort,
    reloadDelay: 300,
    reloadOnRestart: true,
    logFileChanges: false,
    open: false,
  });

  watch();
}));

// ------------------------------------------------------------------------------------------
// TASK: watch
// ------------------------------------------------------------------------------------------
gulp.task('watch', gulp.series('default', () => {
  watch();
}));

function watch() {
  gulp.watch(config.phpGlobs, gulp.series('lint-php'));
  gulp.watch(config.sassGlobs, gulp.series('styles'));
  gulp.watch(config.scriptsGlobs, gulp.series('scripts'));
  gulp.watch(config.translationsGlobs, gulp.series('scripts'));
  gulp.watch(config.faviconPath, gulp.series('favicon'));

  // Browsersync reload, timeout prevents repeated reloads in a short time
  let reloadTimeout = null;
  gulp.watch(config.browsersyncWatch, () => {
    clearTimeout(reloadTimeout);
    reloadTimeout = setTimeout(() => {
      browsersync.reload();
    }, 500);
  }).on('error', () => {
    // silently catch error typically caused by renaming watched folders
  });
}

// ------------------------------------------------------------------------------------------
// GIT HOOKS (defined in package.json)
// ------------------------------------------------------------------------------------------
gulp.task('pre-commit', gulp.series('lint', 'test'));

// -----------------------------------------------------------------------------
// Notify
// -----------------------------------------------------------------------------
let notifyMessages = [];
let notifyTimeout;

// Notify console, browser and desktop
function notify(title, msg, type = 'info', icon) {
  // Add some colors
  const shortMsg = msg.length > 60 ? `${msg.substring(0, 60)}...` : msg;
  let titleCli = title;
  let msgBrowser = `${title}: ${shortMsg}`;
  if (type === 'info') {
    titleCli = util.colors.blue.bold(title);
    msgBrowser = `<span style="color:deepskyblue;">${title}</span>: ${shortMsg}`;
  } else if (type === 'warning') {
    titleCli = util.colors.yellow.bold(title);
    msgBrowser = `<span style="color:orange;">${title}</span>: ${shortMsg}`;
  } else if (type === 'error') {
    titleCli = util.colors.red.bold(title);
    msgBrowser = `<span style="color:red;">${title}</span>: ${shortMsg}`;
  }

  // Log to console
  util.beep();
  util.log(`${titleCli}:`, msg);
  // Log to browser
  notifyBrowser(msgBrowser);
  // Log to desktop
  notifier.notify({ title, message: shortMsg.replace(/<\/?[^>]+(>|$)/g, ''), icon });
}

// Notify browser using Browsersync
function notifyBrowser(msg) {
  notifyMessages.push(msg);
  clearTimeout(notifyTimeout);
  notifyTimeout = setTimeout(() => {
    browsersync.notify(`<div style='text-align:left;'>${notifyMessages.join('<br>')}</div>`, 10000);
    notifyMessages = [];
  }, 2000); // delay is for browsers reload
}

// -----------------------------------------------------------------------------
// Error handler
// -----------------------------------------------------------------------------
function onError(e) {
  const task = util.env._[0];
  notify(e.plugin || 'Gulp', e.message, 'error');

  // Ignore errors in watch and serve tasks
  if (['serve', 'watch'].includes(task)) {
    if (this && this.emit) {
      this.emit('end');
    }
  } else {
    process.exit(1);
  }
}

// -----------------------------------------------------------------------------
// SVG icons
// -----------------------------------------------------------------------------
// Get SVG icons (files) according list - config.iconsGlobs
function svgIcons() {
  const iconsCommaSep = config.iconsList.join(',');
  const globs = config.iconsGlobs.map(glob => glob.replace('*', `{${iconsCommaSep}}`));
  return gulp.src(globs).pipe(plumber(onError));
}

// Generate inline SVGs for usage in SASS styles
let inlineSvgSassCache;
function inlineSvgSass() {
  const stream = new PassThrough({ objectMode: true });

  if (inlineSvgSassCache) {
    stream.push(inlineSvgSassCache);
    stream.push(null);
  } else {
    const icons = [];
    svgIcons()
      .pipe(svgo({ plugins: [{ removeDimensions: true }] }))
      .pipe(through.obj(
        // Collect content of SVGs
        (f, _, cb) => {
          icons.push({
            name: path.basename(f.path, '.svg'),
            svg: f.contents.toString().replace(/"/g, '\''),
          });
          cb();
        },
        // Generate SASS helper function using Mustache template
        cb => fs.readFile(config.iconsSassTemplate, 'utf8', (err, template) =>
          (err ?
            cb(new util.PluginError(err)) :
            cb(null, new util.File({
              path: 'styles.scss',
              contents: Buffer.from(mustache.render(template, { icons })),
            })))),
      ))
      .on('data', (f) => {
        inlineSvgSassCache = f;
        stream.push(inlineSvgSassCache);
        stream.push(null);
      });
  }

  return stream;
}

// -----------------------------------------------------------------------------
// Localization
// -----------------------------------------------------------------------------
class LocalizationPlugin {
  constructor() {
    this.extracted = [];
  }

  // Extract used localization keys (messages) from JavaScripts using Esprima
  extract() {
    return through.obj((file, enc, cb) => {
      const s = esprima.Syntax;
      const varsRegex = new RegExp(`^(${config.translatorVars.join('|')})$`, 'i');

      (esprimaUtils.filter(
        esprimaUtils.parse(file.contents.toString()),
        // STEP 1: Find expressions: *.trans(...) or *.transChoice(...)
        node => node.type === s.CallExpression &&
        node.callee.type === s.MemberExpression && node.callee.property.type === s.Identifier &&
        (node.callee.property.name === 'trans' || node.callee.property.name === 'transChoice'),
      ) || [])
        // STEP 2: Extract the name of the variable
        .reduce((out, node) => {
          const object = node.callee.object;
          if (object.type === s.Identifier) {
            out.push({ node, variable: object.name });
          } else if (object.type === s.MemberExpression && object.property.type === s.Identifier) {
            out.push({ node, variable: object.property.name });
          }
          return out;
        }, [])
        // STEP 3: Filter out unexpected variable names
        .filter(item => varsRegex.test(item.variable))
        // STEP 4: Extract message keys from function arguments
        .forEach((item) => {
          const node = item.node;
          const key = item.node.arguments[0].value;
          let domain = 'messages';

          if (node.callee.property.name === 'trans' && node.arguments.length >= 3) {
            domain = node.arguments[2].value;
          } else if (node.callee.property.name === 'transChoice' && node.arguments.length >= 4) {
            domain = node.arguments[3].value;
          }

          // Create set for domain if not exists
          if (!this.extracted[domain]) { this.extracted[domain] = new Set(); }

          // Add key to domain set
          this.extracted[domain].add(key);
        });

      cb(null, file);
    });
  }

  // Write locales as JavaScript files
  write(done) {
    const extracted = this.extracted;
    const locales = [];

    // Add locale key => message definition
    function add(locale, domain, key, message) {
      if (!locales[locale][domain]) { locales[locale][domain] = {}; }
      locales[locale][domain][key] = message;
    }

    // Read locale files (*.*.neon) and load only translations used in code
    function load(file, enc, cb) {
      const [, domain, locale] = file.path.match(/\/([^/]*)\.([^/]*)\.neon$/);
      const data = neon.decode(file.contents.toString(), neon.OUTPUT_AUTO);

      if (data) {
        const messages = flat(data);

        // Create locale table if not exists
        if (!locales[locale]) { locales[locale] = {}; }

        // Copy found keys to locale table
        if (extracted[domain]) {
          Array.from(extracted[domain].values())
            .filter(key => messages[key])
            .forEach(key => add(locale, domain, key, messages[key]));
        }
      }

      cb();
    }

    // Generate JavaScript locale files
    function generate(cb) {
      let missingKeys = 0;
      Object.keys(locales).forEach((lang) => {
        const locale = locales[lang];
        const json = JSON.stringify({ locale: lang, translations: { [lang]: locale } }, null, 2);
        this.push(new util.File({
          path: `${lang}.js`,
          contents: Buffer.from(`Translator.fromJSON(${json});\n`),
        }));

        // Print missing keys
        Object.keys(extracted).forEach(domain =>
          Array.from(extracted[domain].values())
            .filter(key => !locale[domain] || !locale[domain][key])
            .forEach((key) => {
              const msg = `${domain}.${key}`;
              util.log(
                `${util.colors.yellow('Localization')}: locale '${util.colors.yellow(lang)}',`,
                `missing key '${util.colors.yellow(msg)}.`,
              );
              missingKeys += 1;
            }));
      });

      if (missingKeys > 0) {
        notify('Localization', `${missingKeys} missing keys`, 'warning');
      }

      cb();
    }

    return gulp.src(config.translationsGlobs)
      .pipe(plumber(onError))
      .pipe(through.obj(load, generate))
      .pipe(config.compressJs ? uglify({ mangle: config.mangleJs }) : util.noop())
      .pipe(storeRev(config.translationsOutput))
      .on('finish', done);
  }
}

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
    .pipe(plumber(onError))
    .pipe(config.sourcemaps ? sourcemaps.init({ loadMaps: true }) : util.noop());
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
    .pipe(plumber(onError))
    .pipe(config.sourcemaps ? sourcemaps.init({ loadMaps: true }) : util.noop())
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
// Store assets revisions and their paths to revision manifest.
// This function can be piped to concurrent (parallel) streams.
// Note: Optional '*' character in destination parameter is replaced by file basename.
// ------------------------------------------------------------------------------------------
function storeRev(destination) {
  const stream = combiner.obj(
    clone(),
    rename(origin => `${config.buildDir}/${destination}`.replace('*', path.basename(origin))),
    rev(),
    revFormat({ prefix: '.' }),
    config.sourcemaps ? sourcemaps.write('.') : util.noop(),
    gulp.dest(config.publicDir),
    size({ showFiles: true, showTotal: false }),
  );

  // Update manifest.json
  const semaphoreKey = destination + Math.random().toString(36);
  stream
    .pipe(semaphore.lockStream('manifest', semaphoreKey))
    .pipe(rev.manifest(`${config.publicDir}/${config.buildDir}/${config.manifest}`, { merge: true }))
    .pipe(through.obj((file, enc, cb) => {
      // Delete old assets
      const newManifest = JSON.parse(file.contents.toString());
      const oldManifest = fs.existsSync(file.path) ? JSON.parse(fs.readFileSync(file.path)) : {};
      Object.keys(oldManifest).forEach((key) => {
        if (!newManifest[key] || newManifest[key] !== oldManifest[key]) {
          const target = `${config.publicDir}/${oldManifest[key]}`;
          del([target, `${target}.map`]);
        }
      });
      cb(null, file);
    }))
    .pipe(gulp.dest('.'))
    .pipe(semaphore.unlockStream('manifest', semaphoreKey));

  return stream;
}
