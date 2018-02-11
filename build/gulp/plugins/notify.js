import browsersync from 'browser-sync';
import notifier from 'node-notifier';
import colors from 'chalk';
import log from 'fancy-log';

class Notify {
  constructor() {
    this.notifyMessages = [];
    this.notifyTimeout = null;
  }

  notify(title, msg, type = 'info', icon) {
    const shortMsg = msg.length > 60 ? `${msg.substring(0, 60)}...` : msg;

    let titleCli;
    let msgBrowser;
    if (type === 'warning') {
      titleCli = colors.yellow.bold(title);
      msgBrowser = `<span style="color:orange;">${title}</span>: ${shortMsg}`;
    } else if (type === 'error') {
      titleCli = colors.red.bold(title);
      msgBrowser = `<span style="color:red;">${title}</span>: ${shortMsg}`;
    } else {
      titleCli = colors.blue.bold(title);
      msgBrowser = `<span style="color:deepskyblue;">${title}</span>: ${shortMsg}`;
    }

    // Notify console
    log(`${titleCli}:`, msg);
    // Notify desktop
    notifier.notify({ title, message: shortMsg.replace(/<\/?[^>]+(>|$)/g, ''), icon });
    // Notify browser
    this.notifyBrowser(msgBrowser);
  }

  notifyBrowser(msg) {
    this.notifyMessages.push(msg);
    clearTimeout(this.notifyTimeout);
    this.notifyTimeout = setTimeout(() => {
      browsersync.notify(`<div style='text-align:left;'>${this.notifyMessages.join('<br>')}</div>`, 10000);
      this.notifyMessages = [];
    }, 2000); // delay is for browsers reload
  }
}

export default new Notify();

