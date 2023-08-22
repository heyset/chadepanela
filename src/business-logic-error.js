export class BusinessLogicError extends Error {
  constructor({ message, code }, ...args) {
    if (args.length > 0) {
      super(message, ...args);
    } else {
      super(message);
    }
    this.code = code;
  }
}
