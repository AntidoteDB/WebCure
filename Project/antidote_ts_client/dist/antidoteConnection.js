'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const net = require('net');
const messageCodes_1 = require('./messageCodes');
const ByteBuffer = require('bytebuffer');
class AntidoteConnection {
  constructor(port, host) {
    this.requests = [];
    this.buffer = new ByteBuffer();
    this.requestTimeoutMs = 5000;
    this.port = port;
    this.host = host;
    this.reconnect();
  }
  reconnect() {
    if (this.socket) {
      this.invalidateSocket(new Error('Reconnecting ...'));
    }
    if (this.host) {
      let socket = (this.socket = net.createConnection(this.port, this.host));
      socket.on('connect', () => this.onConnect());
      socket.on('data', data => this.onData(data));
      socket.on('close', hasError => this.onClose(hasError));
      socket.on('timeout', () => this.onTimeout());
      socket.on('error', err => this.onError(err));
    }
  }
  close() {
    this.host = undefined;
    if (this.socket) {
      this.socket.destroy();
      this.socket = undefined;
    }
  }
  onConnect() {
    // TODO console.log("connected")
  }
  onData(data) {
    this.buffer.append(data);
    this.buffer.flip();
    this.readMessagesFromBuffer();
  }
  readMessagesFromBuffer() {
    let buffer = this.buffer;
    while (buffer.remaining() >= 4) {
      buffer.mark();
      let messageLength = buffer.readUint32();
      // See if we have the complete message
      if (buffer.remaining() < messageLength) {
        // rewind the offset
        buffer.reset();
        break;
      }
      // We have a complete message from riak
      let slice = buffer.slice(undefined, buffer.offset + messageLength);
      let code = slice.readUint8();
      if (code != 0) {
        // Our fun API does some creative things like ... returning only
        // a code, with 0 bytes following. In those cases we want to set
        // decoded to null.
        let decoded = null;
        if (messageLength > 1) {
          let ResponseProto = messageCodes_1.MessageCodes.messageCodeToProto(code);
          // GH issue #45
          // Must use 'true' as argument to force copy of data
          // otherwise, subsequent fetches will clobber data
          decoded = ResponseProto.decode(slice.toBuffer(true));
        }
        this.handleResponse(code, decoded);
      } else {
        let errorProto = messageCodes_1.MessageCodes.antidotePb.ApbErrorResp.decode(
          slice.toBuffer(true)
        );
        let errorCode = errorProto.errcode;
        let errorMsg = errorProto.errmsg;
        this.handleError(errorCode, errorMsg.toUTF8());
      }
      // skip past message in buffer
      buffer.skip(messageLength);
      // repeat until we are out of messages
    }
    // ByteBuffer's 'flip()' effectively clears the buffer which we don't
    // want. We want to flip while preserving anything in the buffer and
    // compact if necessary.
    let newOffset = buffer.remaining();
    // Compact if necessary
    if (newOffset > 0 && buffer.offset !== 0) {
      buffer.copyTo(buffer, 0);
    }
    buffer.offset = newOffset;
    buffer.limit = buffer.capacity();
  }
  handleResponse(code, decoded) {
    let request = this.requests.shift();
    if (request) {
      this.resolve(request, decoded);
    } else {
      console.log(`Unexpected response with code ${code} and value ${JSON.stringify(decoded)}`);
    }
  }
  handleError(errorCode, errorMsg) {
    let request = this.requests.shift();
    if (request) {
      this.reject(request, new Error(`Antidote-PB Error code ${errorCode}:\n${errorMsg}`));
    } else {
      console.log(`Unexpected error response with code ${errorCode} and message:\n ${errorMsg}`);
    }
  }
  onClose(hasError) {
    this.invalidateSocket(new Error('Connection closed'));
  }
  onError(err) {
    this.rejectPending(err);
  }
  onTimeout() {
    this.rejectPending(new Error('Connection timed out'));
  }
  onRequestTimeout() {
    this.invalidateSocket(new Error('Request timed out'));
  }
  invalidateSocket(err) {
    this.rejectPending(err);
    this.buffer.clear();
    if (this.socket) {
      this.socket.destroy();
    }
    this.socket = undefined;
  }
  /** rejects all requests, which are still open */
  rejectPending(err) {
    let reqs = this.requests;
    for (let req of reqs) {
      this.reject(req, err);
    }
    this.requests = [];
  }
  reject(req, err) {
    req.reject(err);
    clearTimeout(req.timer);
  }
  resolve(req, response) {
    req.resolve(response);
    clearTimeout(req.timer);
  }
  sendRequest(messageCode, encodedMessage) {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        // try to reconnect:
        this.reconnect();
      }
      if (!this.socket) {
        return Promise.reject('Could not connect to server.');
      }
      let header = new Buffer(5);
      header.writeInt32BE(encodedMessage.byteLength + 1, 0);
      header.writeUInt8(messageCode, 4);
      let msg = Buffer.concat([header, Buffer.from(encodedMessage)]);
      this.socket.write(msg);
      this.requests.push({
        resolve: resolve,
        reject: reject,
        timer: setTimeout(_ => this.onRequestTimeout(), this.requestTimeoutMs)
      });
    });
  }
}
exports.AntidoteConnection = AntidoteConnection;
//# sourceMappingURL=antidoteConnection.js.map
