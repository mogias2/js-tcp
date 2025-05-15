'use strict';

import logger from '../logger.js';

export default class SessionManager {
  constructor() {
    this.session_list = new Map();
  }

  destroy(forced) {
    for (const [key, value] of this.session_list) {
      const session = value;
      session.close(0, forced);
    }
    this.session_list.clear();
  }

  addSession(id, session) {
    if (this.session_list.has(id) === true) {
      logger.warn(`already exists session: ${id}`);
      return false;
    }
    this.session_list.set(id, session);
    //logger.debug(`session count: ${this.session_list.count()}`);
    return true;
  }

  removeSession(id) {
    this.session_list.delete(id);
    //logger.debug(`session count: ${this.session_list.count()}`);
  }

  getSession(id) {
    return this.session_list.get(id);
  }
};
