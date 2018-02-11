import gulp from 'gulp';
import svgo from 'gulp-svgmin';
import mustache from 'mustache';
import through from 'through2';
import path from 'path';
import fs from 'fs';
import Vinyl from 'vinyl';
import PluginError from 'plugin-error';
import { PassThrough } from 'stream';
import config from '../config';

class SvgPlugin {
  constructor(cfg) {
    this.config = cfg;
    this.inlineSvgSassCache = null;
  }

  rawIcons() {
    const iconsCommaSep = this.config.iconsList.join(',');
    const globs = this.config.iconsGlobs.map(glob => glob.replace('*', `{${iconsCommaSep}}`));
    return gulp.src(globs);
  }

  sassHelper() {
    const stream = new PassThrough({ objectMode: true });

    if (this.inlineSvgSassCache) {
      stream.push(this.inlineSvgSassCache);
      stream.push(null);
    } else {
      const icons = [];
      this.rawIcons()
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
          cb => fs.readFile(this.config.iconsSassTemplate, 'utf8', (err, template) =>
            (err ?
              cb(new PluginError(err)) :
              cb(null, new Vinyl({
                path: 'styles.scss',
                contents: Buffer.from(mustache.render(template, { icons })),
              })))),
        ))
        .on('data', (f) => {
          this.inlineSvgSassCache = f;
          stream.push(this.inlineSvgSassCache);
          stream.push(null);
        });
    }

    return stream;
  }
}

export default new SvgPlugin(config);
