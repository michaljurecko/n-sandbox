import del from 'del';
import { gulp } from '../plugins/errorHandler';
import config from '../config';

// ------------------------------------------------------------------------------------------
// TASK: clean
// ------------------------------------------------------------------------------------------
gulp.task('clean', () => del(config.clean));
