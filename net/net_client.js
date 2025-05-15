"use strict";

import net from "net";
import isUndefined from "../util.js";
import logger from "../logger.js";
import NetBase from "./net_base.js";
//import SocketEventHandler from "./socket_event_handler.js";

export default class NetClient extends NetBase {
  constructor(name, SessionType, reconnect = false) {
    super(name, "client", SessionType);
    this.connected = false;
    this.reconnect = reconnect;
  }

  //===================================================================================================
  // virtual
  disconnected() {}

  tryConnect() {
    this.createConnection();
    if (this.reconnect && !this.isConnected()) {
      setTimeout(() => {
        if (!this.isConnected()) {
          this.tryConnect();
        }
      }, 3000);
    }
  }
  //---------------------------------------------------------------------------------------------------
  start(port, addr) {
    if (isUndefined(this.createSession)) {
      logger.error(`${this.name} has not session creator`);
      return;
    }

    this.addr = addr;
    this.port = port;
    this.tryConnect();
  }

  destroy(forced) {
    return new Promise(async (resolve, reject) => {
      this.connected = false;
      this.reconnect = false;

      if (!isUndefined(this.session)) {
        await this.session.close(0, forced);
      }

      setTimeout(() => {
        logger.info(`${this.name} net clinet destroyed`);
        resolve();
      }, 200);
    });
  }

  createConnection() {
    if (this.isConnected()) {
      return;
    }
    this.socket = net.createConnection(
      this.port,
      this.addr,
      this.onConnect.bind(this)
    );
  }

  async stop(forced) {
    await this.destroy(forced);
  }

  onConnect() {
    this.connected = true;
    const socket = this.socket;
    this.socket = null;
    const session = this.createSession();

    if (session.init(1, socket) === false) {
      session = null;
      socket.destroy();
      logger.error(`failed to init session`);
      return;
    }

    this.session = session;
    session.connected(this);
  }

  closeSession(session_id) {
    this.connected = false;
    this.session = null;
    this.disconnected();

    if (this.reconnect) {
      this.tryConnect();
    }
  }

  getSession() {
    return this.session;
  }

  isConnected() {
    return this.connected;
  }
}
