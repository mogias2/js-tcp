'use strict';

export default class NetBase {
  constructor(name, type, SessionType) {
    this.name = name;
    this.type = type;
    this.createSession = NetBase.sessionCreator(SessionType);
  }

  static sessionCreator(SessionType) {
    return () => {
      const session = new SessionType();
      return session;
    }
  }
};
