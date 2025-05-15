'use strict';

import isUndefined from '../util.js';
import logger from '../logger.js';

export default class SocketEventHandler {
  static onError(err) {
    if (err.code === 'ECONNRESET') {
      logger.warn(err.code);
    } else {
      logger.error(err);
    }

    const socket = this;
    socket.destroy();
  }

  static onCloseClient(/*this = session,*/connector, had_error) {
    if (had_error === true) {
      logger.warn(`socket had error`);
    }

    this.closed = true;
    this.clear();

    if (!isUndefined(connector)) {
      connector.session = null;
      connector.connected = false;
      connector.disconnected();
    }

    const socket = this.socket;
    logger.info(`${connector.name} disconnected(${this.getId()}): ${socket.remoteAddress}:${socket.remotePort}`);
  }

  static onCloseServer(/*this = session,*/listener, had_error) {
    if (had_error === true) {
      logger.warn(`socket had error`);
    }

    this.closed = true;
    this.clear();

    if (!isUndefined(listener)) {
      if (listener.session_mgr) {
        listener.session_mgr.removeSession(this.getId());
      }
    }

    const socket = this.socket;
    logger.info(`${listener.name} disconnected(${this.getId()}): ${socket.remoteAddress}:${socket.remotePort}`);
  }

  static onEnd(/*this = session,*/name) {
    const socket = this.socket;
    logger.debug(`${name} closed(${this.getId()}): ${socket.remoteAddress}:${socket.remotePort}`);
  }

  static onTimeout() {
    const socket = this;
    socket.destroy();
    //logger.warn(`socket timeout: ${socket.remoteAddress}:${socket.remotePort}`);
  }
}
