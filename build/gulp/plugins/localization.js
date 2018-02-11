/* global Buffer */
import esprimaUtils from 'esprima-ast-utils';
import uglify from 'gulp-uglify-es/lib/index';
import flat from 'flat';
import neon from 'neon-js';
import * as esprima from 'esprima';
import through from 'through2';
import gulp from 'gulp';
import colors from 'chalk';
import log from 'fancy-log';
import Vinyl from 'vinyl';
import notify from './notify';
import manifest from './manifest';
import config from '../config';

class LocalizationPlugin {
  constructor(cfg) {
    this.config = cfg;
    this.extracted = [];
  }

  // Extract used localization keys (messages) from JavaScripts using Esprima
  extract() {
    return through.obj((file, enc, cb) => {
      const s = esprima.Syntax;
      const varsRegex = new RegExp(`^(${this.config.translatorVars.join('|')})$`, 'i');

      (esprimaUtils.filter(
        esprimaUtils.parse(file.contents.toString()),
        // STEP 1: Find expressions: *.trans(...) or *.transChoice(...)
        node =>
          node.type === s.CallExpression &&
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
        this.push(new Vinyl({
          path: `${lang}.js`,
          contents: Buffer.from(`Translator.fromJSON(${json});\n`),
        }));

        // Print missing keys
        Object.keys(extracted).forEach(domain =>
          Array.from(extracted[domain].values())
            .filter(key => !locale[domain] || !locale[domain][key])
            .forEach((key) => {
              const msg = `${domain}.${key}`;
              log(
                `${colors.yellow('Localization')}: locale '${colors.yellow(lang)}',`,
                `missing key '${colors.yellow(msg)}.`,
              );
              missingKeys += 1;
            }));
      });

      if (missingKeys > 0) {
        notify('Localization', `${missingKeys} missing keys`, 'warning');
      }

      cb();
    }

    return gulp.src(this.config.translationsGlobs)
      .pipe(through.obj(load, generate))
      .pipe(this.config.compressJs ? uglify({ mangle: this.config.mangleJs }) : through.obj())
      .pipe(manifest.dest(this.config.translationsOutput))
      .on('finish', () => {
        this.extracted = [];
        done();
      });
  }
}

export default new LocalizationPlugin(config);
