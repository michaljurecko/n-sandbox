import sourcemaps from 'gulp-sourcemaps';
import combiner from 'stream-combiner2';
import rev from 'gulp-rev';
import rename from 'gulp-simple-rename';
import revFormat from 'gulp-rev-format';
import semaphore from 'stream-semaphore';
import size from 'gulp-size';
import gulp from 'gulp';
import through from 'through2';
import clone from 'gulp-clone';
import del from 'del';
import path from 'path';
import fs from 'fs';
import config from '../config';

class ManifestPlugin {
  constructor(cfg) {
    this.config = cfg;
  }

  // ------------------------------------------------------------------------------------------
  // Store assets revisions and their paths to revision manifest.
  // This function can be piped to concurrent (parallel) streams.
  // Note: Optional '*' character in destination parameter is replaced by file basename.
  // ------------------------------------------------------------------------------------------
  dest(destination) {
    const stream = combiner.obj(
      clone(),
      rename(origin => `${this.config.buildDir}/${destination}`.replace('*', path.basename(origin))),
      rev(),
      revFormat({ prefix: '.' }),
      this.config.sourcemaps ? sourcemaps.write('.') : through.obj(),
      gulp.dest(this.config.publicDir),
      size({ showFiles: true, showTotal: false }),
    );

    // Update manifest.json
    const semaphoreKey = destination + Math.random().toString(36);
    stream
      .pipe(semaphore.lockStream('manifest', semaphoreKey))
      .pipe(rev.manifest(`${this.config.publicDir}/${this.config.buildDir}/${this.config.manifest}`, { merge: true }))
      .pipe(through.obj((file, enc, cb) => {
        // Delete old assets
        const newManifest = JSON.parse(file.contents.toString());
        const oldManifest = fs.existsSync(file.path) ? JSON.parse(fs.readFileSync(file.path)) : {};
        Object.keys(oldManifest).forEach((key) => {
          if (!newManifest[key] || newManifest[key] !== oldManifest[key]) {
            const target = `${this.config.publicDir}/${oldManifest[key]}`;
            del([target, `${target}.map`]);
          }
        });
        cb(null, file);
      }))
      .pipe(gulp.dest('.'))
      .pipe(semaphore.unlockStream('manifest', semaphoreKey));

    return stream;
  }
}

export default new ManifestPlugin(config);
