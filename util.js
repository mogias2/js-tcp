'use strict';

import idgen from 'idgen';
import bufferpack from 'bufferpack';

export default function isUndefined(obj) {
  return (typeof obj === 'undefined') || (obj === null);
}

export function isEmptyObject(obj) {
  for (const prop in obj) {
    if (obj.hasOwnProperty(prop)) {
      return false;
    }
  }
  return JSON.stringify(obj) === JSON.stringify({});
};

export function isEmptyString(str) {
  return isUndefined(str) || typeof str !== 'string' || (str.length === 0);
}

export function generateUniqueId(len) {
  let uniqueID = idgen(len);
  uniqueID = uniqueID.replace(/_/g, 'o').replace(/-/g, 'p');
  const first = uniqueID.substring(0, 1);
  if (!isNaN(first)) {
    for (let i = 1; i < uniqueID.length - 1; ++i) {
      const next = uniqueID.substring(i, i + 1);
      if (isNaN(next)) {
        uniqueID = next.concat(first).concat(uniqueID.slice(2, uniqueID.length));
        break;
      }
    }
  }
  return uniqueID;
}

export function getLocalTime(offset = true) {
  const now = new Date();
  return offset ? (new Date(now.getTime() - (now.getTimezoneOffset() * 60000))) : now;
}

export function getUnixTime() {
  return Math.floor(Date.now() / 1000);
}

export function normalizePort(val) {
  const port = parseInt(val, 10);
  if (isNaN(port)) {
    return val;
  }

  if (port > 0 && port <= 65535) {
    return port;
  }
  return false;
}

export function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

export function toInt32(low, high) {
  return ((0x0000ffff & high) << 16) | (0x0000ffff & low);
}

export function getLowFromInt32(val) {
  return val & 0x0000ffff;
}

export function getHighFromInt32(val) {
  return (val & 0xffff0000) >> 16;
}

export function toInt64(high, low) {
  const buffer = new Buffer(8);
  buffer.fill(0);
  buffer.writeUInt32BE(high, 0);
  buffer.writeUInt32BE(low, 4);
  return (buffer.readUInt32BE(0) << 16) + buffer.readUInt32BE(4);
}

export function getHighValue(value) {
  const buffer = new Buffer(4);
  buffer.writeUInt32BE(value >> 16, 0);
  return buffer.readUInt32BE(0);
}

export function getLowValue(value) {
  const buffer = new Buffer(4);
  buffer.writeUInt32BE(value & 0x0000ffff, 0);
  return buffer.readUInt32BE(0);
}

export function packBinary(format, args) {
  const pack = bufferpack.pack(format, args);
  if (isUndefined(pack)) {
    return false;
  }
  return pack.toString('binary');
}

export function unpackBinary(format, arg) {
  return bufferpack.unpack(format, Buffer.from(arg, 'binary'));
}

export function pack(format, ...values) {
  if (format.length !== values.length) {
    return null;
  }

  let len = 0;
  const buffer = Buffer.alloc(256);
  for (let i = 0; i < format.length; ++i) {
    switch (format.charAt(i)) {
      case 'a':
        {
          const val = Buffer.from(values[i], 'utf-8');
          buffer.writeUInt16LE(val.length, len);
          len += 2;
          val.copy(buffer, len);
          len += val.length;
        }
        break;
      case 'i':
        buffer.writeInt32LE(values[i], len);
        len += 4;
        break;
      case 'l':
        buffer.writeUInt32LE(values[i], len);
        len += 4;
        break;
      case 'C':
        buffer.writeUInt8(values[i], len);
        len += 1;
        break;
      case 'S':
        buffer.writeUInt16LE(values[i], len);
        len += 2;
        break;
      default:
        break;
    }
  }
  return buffer.slice(0, len).toString('binary');
}

export function unpack(format, str) {
  const buffer = Buffer.from(str, 'binary');
  const values = [];
  let len = 0;
  for (let i = 0; i < format.length; ++i) {
    switch (format.charAt(i)) {
      case 'a':
        {
          const str_len = buffer.readUInt16LE(len);
          len += 2;
          const val = Buffer.alloc(str_len);
          buffer.copy(val, 0, len, (len + str_len));
          len += str_len;
          values.push(val.toString('utf-8'));
        }
        break;
      case 'i':
        values.push(buffer.readInt32LE(len));
        len += 4;
        break;
      case 'l':
        values.push(buffer.readUInt32LE(len));
        len += 4;
        break;
      case 'C':
        values.push(buffer.readUInt8(len));
        len += 1;
        break;
      case 'S':
        values.push(buffer.readUInt16LE(len));
        len += 2;
        break;
      default:
        break;
    }
  }
  return values;
}
