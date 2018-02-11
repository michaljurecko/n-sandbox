import merge from 'merge2';
import svg2png from 'svg2png';
import filter from 'gulp-filter';
import toIco from 'to-ico';
import size from 'gulp-size';
import through from 'through2';
import File from 'vinyl';
import { gulp } from '../plugins/errorHandler';
import manifest from '../plugins/manifest';
import config from '../config';

// ------------------------------------------------------------------------------------------
// TASK: favicon
// ------------------------------------------------------------------------------------------
gulp.task('favicon', () => {
  const stream = gulp.src(config.faviconPath)
    .pipe(through.obj(function (svg, _, cb) {
      Promise.all([
        // Create favicon.ico: 16x16 + 32x32 + 48x48 + 64x64
        Promise.all([16, 32, 48, 64].map(s => svg2png(svg.contents, { width: s, height: s })))
          .then(pngImages => toIco(pngImages))
          .then(buffer => this.push(new File({ path: 'favicon.ico', contents: buffer }))),
        // Create favicon.png: 256x256
        svg2png(svg.contents, { width: 256, height: 256 })
          .then(buffer => this.push(new File({ path: 'favicon.png', contents: buffer }))),
        // Create apple.png: 180x180
        svg2png(svg.contents, { width: 180, height: 180 })
          .then(buffer => this.push(new File({ path: 'apple.png', contents: buffer }))),
      ])
        .then(() => cb(null))
        .catch(error => cb(error));
    }));

  return merge(
    // Write icons to build dir
    stream.pipe(manifest.dest(config.faviconOutput)),
    // Write favicon.ico to public dir for compatibility reasons
    stream
      .pipe(filter(file => file.path === 'favicon.ico'))
      .pipe(gulp.dest(`${config.publicDir}`))
      .pipe(size({ showFiles: true, showAll: false })),
  );
});
