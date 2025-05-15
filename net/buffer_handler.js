'use strict'

const PACKET_HEADER_LEN = 4;
const PACKET_BODY_HEADER_LEN = 4;

export default class BufferHandler {
  constructor(buffer_size) {
    this.buffer_size = buffer_size;
    this.buffer = Buffer.alloc(buffer_size);
    this.clear();
  }

  clear() {
    this.accumulating_len = 0;
    this.head = 0;
    this.tail = 0;
  }

  write(buffer) {
    const len = buffer.length;
    if (this.tail + len > this.buffer_size) {
      let nextSize = this.buffer_size;
      while (nextSize < (this.tail + len)) {
        nextSize <<= 1;
      }

      let newBuffer = Buffer.alloc(nextSize);
      this.buffer.copy(newBuffer, 0, 0, this.tail);
      let oldBuffer = this.buffer;
      this.buffer = newBuffer;
      oldBuffer = null;
      this.buffer_size = nextSize;
    }

    buffer.copy(this.buffer, this.tail);
    this.tail += len;
    this.accumulating_len += len;
  }

  read(start, end) {
    if (this.accumulating_len < end) {
      const remain = end - this.accumulating_len;
      if (remain > (this.buffer_size - this.tail)) {
       this.buffer.copy(this.buffer, 0, this.head, this.tail);
       this.head = 0;
       this.tail = this.accumulating_len;
      }
      return null;
    }

    this.accumulating_len -= end;
    const buffer = this.buffer.slice(this.head + start, this.head + end);
    this.moveHead(end);
    return buffer;
  }

  readUInt16(offset = 0) {
    return this.buffer.readUInt16BE(this.head + offset);
  }

  hasRemain(size) {
      return this.accumulating_len < size;
  }

  moveHead(len) {
    if (this.accumulating_len <= 0) {
      this.head = 0;
      this.tail = 0;
    } else {
      this.head += len;
    }
  }
};
