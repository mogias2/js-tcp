'use strict';

const debug = require('debug')('net');
//import { setTimeout } from 'timers';
import isUndefined from '../util.js';
import logger from '../logger.js';
import BufferHandler from './buffer_handler.js';

const BUFFER_SIZE = 65535;

const SOCKET_STATE = {
  CLOSED: 0,
  ESTABLISHED: 1,
  CLOSING: 2,
}

export default class NetSession {
  constructor() {
    this.DISCONNECT_TIMEOUT = 3000;
    this.bufferHandler = new BufferHandler(BUFFER_SIZE);
    this.socket = null;
  }

  init(id, socket) {
    this.id = id;
    this.socket = socket;

    if (isUndefined(this.constructor.initReceiveFunc)) {
      logger.error('initReceiveFunc is undefined');
      return false;
    }
    this.constructor.initReceiveFunc();
    this.state = SOCKET_STATE.ESTABLISHED;
    return true;
  }

  close(time = 0, forced = false) {
    if (this.socket === null) {
      return;
    }

    this.state = SOCKET_STATE.CLOSING;
    if (time == 0) {
      (forced === true) ? this.socket.end() : this.socket.destroy();
    } else {
      this.socket.setTimeout(time);
    }
  }

  getId() {
    return this.id;
  }

  isConnecting() {
    return (this.state == SOCKET_STATE.ESTABLISHED) && (this.closed === false);
  }

  //===================================================================================================
  // virtual
  clear() {
  }

  onConnect() {
  }

  static makePacketHeader(buffer, len, index) {
  }

  static getHeaderSize() {
    return 4;
  }

  static recvFunc(session, index, buffer) {
    if (isUndefined(this.prototype.recv[index])) {
      logger.error(`invalid packet index: ${index}`);
      session.close();
    } else {
      this.prototype.recv[index](session, buffer);
    }
  }
  //---------------------------------------------------------------------------------------------------

  writeBuffer(buffer) {
    this.bufferHandler.write(buffer);
  }

  readBuffer(packet) {
    if (this.bufferHandler.hasRemain(this.constructor.getHeaderSize())) {
      return false;
    }

    const len = this.bufferHandler.readUInt16();
    if (len == 0) {
      return false;
    }

    packet.index = this.bufferHandler.readUInt16(2);
    packet.buffer = this.bufferHandler.read(this.constructor.getHeaderSize(), len);
    return (packet.buffer !== null);
  }

  sendPacket(index, packet) {
    const len = packet.length + this.constructor.getHeaderSize();
    const buffer = Buffer.alloc(len);
    this.constructor.makePacketHeader(buffer, len, index);
    Buffer.from(packet).copy(buffer, this.constructor.getHeaderSize());

    if (!this.send(buffer)) {
      logger.error(`failed to send: ${len}(bytes) index(${index})`);
      return false;
    }
    return true;
  }

  send(buffer) {
    if (this.state != SOCKET_STATE.ESTABLISHED) {
      logger.warn(`invalid socket state: state(${this.state})`);
      return false;
    }
    return this.socket.write(buffer);
  }

  onError(/*this = session,*/err) {
    if (err.code === 'ECONNRESET') {
      logger.warn(err.code);
    } else {
      logger.error(err);
    }
    this.close();
  }

  onData(/*this = session,*/data) {
    const packet = {};
    this.writeBuffer(data);
    while (this.readBuffer(packet)) {
      this.constructor.recvFunc(this, packet.index, packet.buffer);
    }
  }

  onClose(/*this = session,*/had_error) {
    this.state = SOCKET_STATE.CLOSED;

    if (had_error === true) {
      logger.warn(`socket had error`);
    }

    this.clear();
    this.container.closeSession(this.getId());
    logger.info(`${this.container.name} disconnected(${this.getId()}): ${this.socket.remoteAddress}:${this.socket.remotePort}`);
  }

  onEnd(/*this = session*/) {
    logger.debug(`socket closed: ${this.socket.remoteAddress}:${this.socket.remotePort}`);
  }

  onTimeout(/*this = session*/) {
    this.close(false);
    logger.info(`socket timeout: ${this.socket.remoteAddress}:${this.socket.remotePort}`);
  }

  connected(container) {
    if (this.socket === null) {
      logger.error(`socket is null`);
      return;
    }

    this.socket.on('error', this.onError.bind(this));
    this.socket.on('data', this.onData.bind(this));
    this.socket.once('close', this.onClose.bind(this));
    this.socket.once('end', this.onEnd.bind(this));
    this.socket.once('timeout', this.onTimeout.bind(this));

    this.container = container;

    this.onConnect();
    logger.info(`${container.name} connected(${this.getId()}): ${this.socket.remoteAddress}:${this.socket.remotePort}`);
  }

  static registerRecv(index, func) {
    if (isUndefined(this.prototype.recv)) {
      this.prototype.recv = [];
    }

    if (isUndefined(this.prototype.recv[index])) {
      this.prototype.recv[index] = func;
      debug(`register recv: ${index}`);
    } else {
      debug(`already register recv: ${index}`);
    }
  }
}
