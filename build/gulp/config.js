import minimist from 'minimist';
import nittro from 'gulp-nittro';

// ------------------------------------------------------------------------------------------
// Configuration, see https://github.com/webrouse/n-sandbox/wiki/Gulp#configuration
// ------------------------------------------------------------------------------------------

// Constants
const args = minimist(process.argv.slice(2));
const fix = args.fix || false;
const production = args.production || false;
const development = !production;
const publicDir = 'www';
const buildDir = 'build';

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
export default {
  // Paths
  publicDir,
  buildDir,
  manifest: 'manifest.json',

  // Global options
  fix, // Fix coding standard issues?
  compressJs: production,
  mangleJs: production,
  compressCss: production,
  sourcemaps: development,

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
  scriptsGlobs: ['gulpfile.babel.js', 'resources/scripts/**/*.js', 'build/**/*.js'],
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
  phpCheckDirs: ['app', 'tests'],
  phpstan: 'phpstan.neon',
  phpecs: 'coding-standard.neon',

  // Browsersync
  browsersync: {
    port: 3000,
    watch: ['app/**/*.{php,neon,latte}', 'resources/translations/*/*.*.neon'],
  },

  // Clean
  clean: [
    '!**/.*', // ignore files starting with dot
    'temp/**/*',
    '!temp/sessions',
    `${publicDir}/${buildDir}/**/*`,
    `${publicDir}/favicon.ico`,
  ],
};
