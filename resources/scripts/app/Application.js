export default class Application {
  constructor(container, translator, snippetManager) {
    this._ = {
      container,
      translator,
      snippetManager,
    };
  }

  run() {
    this.initDropZones();

    // eslint-disable-next-line no-console
    console.log(`Translator test: ${this._.translator.trans('app.started')}`);
  }

  initDropZones() {
    const elements = [];
    this._.snippetManager.on('after-update', () => {
      Array.from(document.querySelectorAll('form input[type="file"]')).forEach((fileInput) => {
        if (elements.indexOf(fileInput) !== -1) {
          return; // already initialized
        }

        elements.push(fileInput);
        const dropZone = this._.container.create('dropZone', { from: fileInput });
        dropZone.attach(fileInput.form.querySelector('.js-drop-zone'));
        dropZone.on('file', (evt) => {
          console.log('newFile', evt);
        });
      });
    });
  }
}
