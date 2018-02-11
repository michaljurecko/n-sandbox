import svgSprite from 'gulp-svg-sprite';
import { gulp } from '../plugins/errorHandler';
import svg from '../plugins/svg';
import manifest from '../plugins/manifest';
import config from '../config';

// ------------------------------------------------------------------------------------------
// TASK: icon - combine icons to SVG sprite in <symbol> format
// ------------------------------------------------------------------------------------------
gulp.task('icons', () =>
  svg.rawIcons()
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
    .pipe(manifest.dest(config.iconsOutput)));
