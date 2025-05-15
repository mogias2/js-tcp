'use strict';

import isUndefined from '../util.js';
import Connector from './connector.js';

export default class ConnectorEx extends Connector {
  constructor(name) {
    super(name);
  }

  //===================================================================================================
  // override from Connector
  disconnected() {
    //this.tryConnect();
  }

  tryConnect() {
    this.createConnection();
    setTimeout(() => {
      this.tryConnect();
    }, 3000);
  }
  //---------------------------------------------------------------------------------------------------
};
