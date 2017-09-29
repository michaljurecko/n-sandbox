/* global _context */
/* global Translator */

import './polyfills';
import onLoad from './onload';
import tweaks from './tweaks';
import Application from './app/Application';

// JavaScript works, replace .no-js class with .js in <html>
const html = document.documentElement;
html.classList.remove('no-js');
html.classList.add('js');

onLoad(() => _context.invoke((Nittro) => {
  // Container builder
  const builder = new Nittro.DI.ContainerBuilder({
    params: {
      page: {
        i18n: {
          connectionError: Translator.trans('error.connection', {}, 'client'),
          unknownError: Translator.trans('error.unknown', {}, 'client'),
        },
      },
    },
    extensions: {
      forms: 'Nittro.Forms.Bridges.FormsDI.FormsExtension',
      ajax: 'Nittro.Ajax.Bridges.AjaxDI.AjaxExtension',
      routing: 'Nittro.Routing.Bridges.RoutingDI.RoutingExtension',
      flashes: 'Nittro.Flashes.Bridges.FlashesDI.FlashesExtension',
      page: 'Nittro.Page.Bridges.PageDI.PageExtension',
    },
    services: {
      application: Application,
    },
    factories: {},
  });

  // Create container
  this.di = builder.createContainer();
  tweaks(this.di, _context);

  // Add existing services
  this.di.addService('translator', Translator);

  // Run services and application
  this.di.runServices();
  this.di.getService('application').run();
}));

