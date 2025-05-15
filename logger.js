'use strict';

//const fs = require('fs');
import log4js from 'log4js';
import log4js_extend from 'log4js-extend';

// const curdir = process.cwd() + '/logs';
// if (!fs.existsSync(curdir)) {
//   fs.mkdirSync(curdir);
// }

class Logger {
  constructor() {
  }

  init(config) {
    log4js.configure(config);

    // log4js_extend(log4js, {
    //   path: __dirname,
    //   format: "at @name (@file:@line:@column)"
    // });

    this.category = config.categories.default.appenders[0];
    Logger.prototype.trace = this.getDefaultLogger().trace.bind(this.getDefaultLogger());
    Logger.prototype.debug = this.getDefaultLogger().debug.bind(this.getDefaultLogger());
    Logger.prototype.info = this.getDefaultLogger().info.bind(this.getDefaultLogger());
    Logger.prototype.warn = this.getDefaultLogger().warn.bind(this.getDefaultLogger());
    Logger.prototype.error = this.getDefaultLogger().error.bind(this.getDefaultLogger());
    Logger.prototype.fatal = this.getDefaultLogger().fatal.bind(this.getDefaultLogger());
  }

  /**
   * Documentation
   * @param {string} category log category
   */
  getLogger(category) {
    return log4js.getLogger(category);
  }

  /**
   * get default logger
   */
  getDefaultLogger() {
    return log4js.getLogger(this.category);
  }

  close() {
    log4js.shutdown(err => {});
  }
}

export default new Logger();
