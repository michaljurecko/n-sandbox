import cssnano from 'cssnano';
import sourcemaps from 'gulp-sourcemaps';
import merge from 'merge2';
import concat from 'gulp-concat';
import sass from 'gulp-sass';
import autoprefixer from 'autoprefixer';
import sassTildaImporter from 'node-sass-tilde-importer';
import postcss from 'gulp-postcss';
import through from 'through2';
import sassLint from 'gulp-sass-lint';
import { gulp } from '../plugins/errorHandler';
import svg from '../plugins/svg';
import notify from '../plugins/notify';
import manifest from '../plugins/manifest';
import config from '../config';

// Custom SASS functions
const sassFunctions = {
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
    notify.notify('gulp-sass', `${warning.getValue()}`, 'warning');
    return sass.compiler.NULL;
  },
};


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

    // SASS & PostCSS
    return merge(svg.sassHelper(), gulp.src(options.entrypoint))
      .pipe(config.sourcemaps ? sourcemaps.init({ loadMaps: true }) : through.obj())
      .pipe(concat('styles.scss'))
      .pipe(sass({ outputStyle: 'compact', importer: sassTildaImporter, functions: sassFunctions }))
      .pipe(postcss(plugins))
      .pipe(manifest.dest(output));
  })));


// ------------------------------------------------------------------------------------------
// TASK: lint styles
// ------------------------------------------------------------------------------------------
gulp.task('lint-styles', () =>
  gulp.src(config.sassGlobs, { base: './' })
    .pipe(sassLint({ configFile: config.sassLintConfig }))
    .pipe(sassLint.format())
    .pipe(sassLint.failOnError()));


// ------------------------------------------------------------------------------------------
// TASK: styles
// ------------------------------------------------------------------------------------------
gulp.task('styles', gulp.series('lint-styles', 'compile-styles'));
