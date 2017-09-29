export default class Application {
  constructor(translator) {
    this._ = {
      translator,
    };
  }

  run() {
    // eslint-disable-next-line no-console
    console.log(`Translator test: ${this._.translator.trans('app.started')}`);
  }
}
