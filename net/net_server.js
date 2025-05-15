'use strict';

import net from 'net';
import isUndefined from '../util.js';
import logger from '../logger.js';
import NetBase from './net_base.js';
import SessionManager from './session_manager.js';
//import SocketEventHandler from './socket_event_handler.js';

export default class NetServer extends NetBase {
  constructor(name, SessionType) {
    super(name, 'server', SessionType);
    this.generated_id = 0;
    this.session_mgr = new SessionManager();
  }

  start(port, addr) {
    if (isUndefined(this.createSession)) {
      logger.error(`${this.name} has not session creator`);
      return;
    }

    const server = net.createServer(this.onAccept.bind(this));
    server.listen(port, addr, () => {
      const address = this.server.address();
      logger.info(`Listening for ${this.name} - ${address.address}:${address.port}`);
    });

    server.on('error', (err) => {
      throw err;
    });

    this.server = server;
  }

  destroy(forced) {
    if (isUndefined(this.server)) {
      return;
    }

    const server = this.server;
    return new Promise(async (resolve, reject) => {
      await this.session_mgr.destroy(forced);
      await server.once('close', () => {
        setTimeout(() => {
          logger.info(`${this.name} net server destroyed`);
          resolve();
        }, 200);
      });
      await server.close();
    });
  }

  async stop(forced) {
    await this.destroy(forced);
  }

  onAccept(socket) {
    const session = this.createSession();

    if (session.init(++this.generated_id, socket) === false) {
      session.close();
      logger.error(`failed to init session`);
      return;
    }

    if (this.session_mgr.addSession(session.getId(), session) === false) {
      session.close();
      logger.error(`failed to add session`);
      return;
    }

    session.connected(this);
  }

  closeSession(session_id) {
    if (!isUndefined(this.session_mgr)) {
      this.session_mgr.removeSession(session_id);
    }
  }

  getSession(id) {
    return this.session_mgr.getSession(id);
  }
};
