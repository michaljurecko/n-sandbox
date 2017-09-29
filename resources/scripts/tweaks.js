// This file contains tweaks and workarounds for Nittro library
export default function (di, _context) {
  // Tuning the page service
  di.getServiceDefinition('page')
    .addSetup((page) => {
      page.on('before-transaction', (evt) => {
        const context = evt.data.context;
        const el = context.element;

        // Prevent the cancellation of the current transaction with a new transaction
        // This prevents double form submit
        if (!('background' in context) && page._.currentTransaction) {
          // Reject transaction
          evt.preventDefault();
          // Prevent browser default action
          if (context.event) { context.event.preventDefault(); }
          // Blur element
          if (el) { el.blur(); }
        }
      });

      page.on('transaction-created', (evt) => {
        // Remove element focus after the transaction
        const el = evt.data.context.element;
        if (el) {
          evt.data.transaction.then(() => el.blur());
        }
      });
    });

  // Nittro 2.0 doesn't hide server side flashes, fix it
  const Message = _context.lookup('Nittro.Flashes.Message');
  Message.defaults.dismiss = 4000;
  Message.defaults.target = 'flashes';
  Message.wrap = function (elem) {
    const message = new Message(null, elem);
    message._.visible = true;
    return message;
  };

  // Set flashes default target
  di.getServiceDefinition('flashes')
    .addSetup((flashes) => {
      const add = flashes.add;
      // eslint-disable-next-line no-param-reassign
      flashes.add = function (content, type, target, rich) {
        add.apply(this, [content, type, target || 'flashes', rich]);
      };
    });

  // Fix Nittro compatibility with ES6 classes compiled with Babel.
  // Classes can be used directly in service factory without the need
  // to create a factory function or register class in _context
  // For example, see 'application' service definition in bootstrap.js.
  // eslint-disable-next-line no-param-reassign
  di.invoke = (callback, args, thisArg) => {
    // eslint-disable-next-line no-underscore-dangle
    const expandedArgs = di._expandArguments(di._autowireArguments(callback, args));
    if (callback.prototype.constructor.toString().includes('classCallCheck(this,')) {
      // eslint-disable-next-line new-cap
      return new callback(...expandedArgs);
    }
    return callback.apply(thisArg || null, expandedArgs);
  };
}
