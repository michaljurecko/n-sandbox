# n-sandbox

[![Latest stable](https://img.shields.io/packagist/v/webrouse/n-sandbox.svg)](https://packagist.org/packages/webrouse/n-sandbox)
[![Donate](https://img.shields.io/badge/Donate-PayPal-green.svg)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=ZU4VST34ZB9J6)

This is an extended version of [nette/sandbox](https://github.com/nette/sandbox) focused on fast development with modern PHP and JS tools.

**[Wiki explains](https://github.com/webrouse/n-sandbox/wiki) how to use present technologies with Nette Framework.**

This sandbox is currently based on `Nette 2.4` due to incompatibility of some extensions with `Nette 3`.

## Requirements

* [PHP](https://php.net) >= 7.1
* [Composer](https://getcomposer.org)
* [Node.js](https://nodejs.org/en) >= 6.0

## Quick start

**Install the `gulp` command**
```
sudo npm install --global gulp-cli
```

**Create a new project using [composer](https://getcomposer.org/)**
```
composer create-project webrouse/n-sandbox path/to/install
cd path/to/install
```

**Install JavaScript dependencies using [npm](https://www.npmjs.com/get-npm)**
```
npm install
```

**Run `serve` task and profit**
```
gulp serve
```

*Visit `http://localhost:3000/checker` to check minimal requirements, if some issues, install the missing extensions.*

*Visit `http://localhost:3000` in your browser to see the welcome page.*

The `serve` task:
 * includes [default](https://github.com/webrouse/n-sandbox/wiki/Gulp#gulp-or-gulp-default) and [watch](https://github.com/webrouse/n-sandbox/wiki/Gulp#gulp-watch) tasks
 * checks coding standards for `php`, `js` and `scss` files
 * compiles `js`, `scss` files and other assets
 * runs the [PHP built-in webserver](http://php.net/manual/en/features.commandline.webserver.php) on `localhost:8000` using project [php.ini](https://github.com/webrouse/n-sandbox/blob/master/php.ini)
 * runs [Browsersync](https://www.browsersync.io) server on `localhost:3000` that proxy requests to the PHP server
 * watches for changes and then check + recompile assets


You can append `--silent` to suppress unnecessary output
```
gulp serve --silent
```

You can append `--fix` flag to automatically fix coding standards issues:
```
gulp --fix
gulp lint --fix
gulp serve --fix
```

To one-shot assets check and compilation run the `default` task:
```
gulp
```

**For more information, see [Tutorial](https://github.com/webrouse/n-sandbox/wiki/Tutorial) or [List of all tasks](https://github.com/webrouse/n-sandbox/wiki/Gulp#list-of-all-project-tasks).**

## What's inside?

 * [Gulp](https://gulpjs.com) task runner
 * Cache busting of all assets with [gulp-rev](https://www.npmjs.com/package/gulp-rev) and [n-asset-macro](https://github.com/webrouse/n-asset-macro)
 * [Rollup](https://www.npmjs.com/package/rollup) + [Babel](https://babeljs.io) compile next generation [ES6 scripts](https://github.com/lukehoban/es6features) to browser-compatible JavaScript
 * [EsLint](https://www.npmjs.com/package/eslint) with [Airbnb JS rules](https://github.com/airbnb/javascript) check scripts coding standards
 * [UglifyEs](https://www.npmjs.com/package/gulp-uglify-es) compresses scripts in production mode
 * [Nittro](https://github.com/nittro/nittro) client-side framework for Nette
 * [Sass](https://www.npmjs.com/package/gulp-sass) compiles [scss](http://sass-lang.com/guide) stylesheets to css
 * [SassLint](https://www.npmjs.com/package/gulp-sass-lint) + [Airbnb CSS rules](https://github.com/airbnb/css) check styles coding standards
 * [Autoprefixer](https://www.npmjs.com/package/autoprefixer) adds css [vendor prefixes](https://developer.mozilla.org/en-US/docs/Glossary/Vendor_Prefix) according to your [browserslist](https://github.com/webrouse/n-sandbox/blob/master/package.json#L68) config
 * [Cssnano](https://www.npmjs.com/package/cssnano) compresses css in production mode
 * [Source maps](https://github.com/webrouse/n-sandbox/wiki/Source-Maps)
 * [Browsersync](https://www.browsersync.io) for synchronised development and testing in multiple browsers and devices 
 * [ECS](https://packagist.org/packages/symplify/easy-coding-standard) checks [nette/coding-standard](https://github.com/nette/coding-standard) in PHP files
 * Localization with [server-side](https://componette.com/kdyby/translation) and [client-side](https://github.com/willdurand/BazingaJsTranslationBundle/blob/master/Resources/doc/index.md) support, only used messages are extracted to JavaScript locales
 * [Menu component extension](https://github.com/Carrooi/Nette-Menu)
 * [Monolog extension](https://github.com/Kdyby/Monolog) for simple logging to various targets
 * [Git hooks](https://www.npmjs.com/package/husky) mapped to gulp tasks
 * [SVG icons](https://github.com/webrouse/n-sandbox/wiki/Icons)
 * Favicon and touch icons generation from SVG
 
 ## Documentation
 
 [Wiki](https://github.com/webrouse/n-sandbox/wiki) explains how to use present technologies and tools.
 
 ## Contributing
 
 Any improvements to the code or documentation are welcome.
 
 The goal is to create a skeleton that allows comfortable development without affecting the application speed.
 
 ## Todo
 
 Create test for each Gulp task with [shunit2](https://github.com/kward/shunit2).
 
 ## License
 
 Nette: New BSD License or GPL 2.0 or 3.0
 
