'use strict';
var __awaiter =
  (this && this.__awaiter) ||
  function(thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function(resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator['throw'](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : new P(function(resolve) {
              resolve(result.value);
            }).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
Object.defineProperty(exports, '__esModule', { value: true });
require('../proto/antidote_proto');
const ByteBuffer = require('bytebuffer');
const antidoteConnection_1 = require('./antidoteConnection');
const messageCodes_1 = require('./messageCodes');
const Long = require('long');
const msgpack = require('msgpack-lite');
/** Connects to antidote on the given port and hostname
 * @param port the port number of Antidote's protocol buffer port (for example 8087)
 * @param host the host running Antidote (for example "localhost")
 */
function connect(port, host) {
  return new ConnectionImpl(new antidoteConnection_1.AntidoteConnection(port, host));
}
exports.connect = connect;
/** Creates a BoundObject, wich Antidote uses as key for data */
function key(key, type, bucket) {
  return {
    key: ByteBuffer.fromUTF8(key),
    type: type,
    bucket: ByteBuffer.fromUTF8(bucket)
  };
}
/** takes a message with an encode method and converts it into an ArrayBuffer */
function encode(message) {
  return message.encode().toBuffer();
}
function _debugPrint(obj) {
  return JSON.stringify(obj, (key, val) => {
    if (val instanceof ByteBuffer) {
      return val.toUTF8();
    } else if (val instanceof Long) {
      return val.toNumber();
    }
    return val;
  });
}
class CrdtFactoryImpl {
  /** returns a reference to a counter object */
  counter(key) {
    return new CrdtCounterImpl(this, key, this.getBucket(), 3 /* COUNTER */);
  }
  /** returns a reference to a fat-counter object */
  fatCounter(key) {
    return new CrdtCounterImpl(this, key, this.getBucket(), 12 /* FATCOUNTER */);
  }
  /** returns a reference to a last-writer-wins register */
  register(key) {
    return new CrdtRegisterImpl(this, key, this.getBucket(), 5 /* LWWREG */);
  }
  /** returns a reference to a multi-value register */
  multiValueRegister(key) {
    return new CrdtMultiValueRegisterImpl(this, key, this.getBucket(), 6 /* MVREG */);
  }
  /** returns a reference to an enable-wins flag object */
  flag_ew(key) {
    return new CrdtFlagImpl(this, key, this.getBucket(), 13 /* FLAG_EW */);
  }
  /** returns a reference to an disable-wins flag object */
  flag_dw(key) {
    return new CrdtFlagImpl(this, key, this.getBucket(), 13 /* FLAG_EW */);
  }
  /** returns a reference to a add-wins set object */
  set(key) {
    return new CrdtSetImpl(this, key, this.getBucket(), 4 /* ORSET */);
  }
  /** returns a reference to a remove-wins set object */
  set_removeWins(key) {
    return new CrdtSetImpl(this, key, this.getBucket(), 10 /* RWSET */);
  }
  /** returns a reference to a remove-resets map */
  rrmap(key) {
    return new CrdtMapImpl(this, key, this.getBucket(), 11 /* RRMAP */);
  }
  /** returns a reference to a grow-only map */
  gmap(key) {
    return new CrdtMapImpl(this, key, this.getBucket(), 8 /* GMAP */);
  }
  readResponseToValue(type, response) {
    let obj;
    switch (type) {
      case 3 /* COUNTER */:
        obj = this.counter('');
        break;
      case 4 /* ORSET */:
        obj = this.set('');
        break;
      case 5 /* LWWREG */:
        obj = this.register('');
        break;
      case 6 /* MVREG */:
        obj = this.multiValueRegister('');
        break;
      case 8 /* GMAP */:
        obj = this.gmap('');
        break;
      case 10 /* RWSET */:
        obj = this.set_removeWins('');
        break;
      case 11 /* RRMAP */:
        obj = this.rrmap('');
        break;
      case 12 /* FATCOUNTER */:
        obj = this.fatCounter('');
        break;
      case 13 /* FLAG_EW */:
        obj = this.flag_ew('');
        break;
      case 14 /* FLAG_DW */:
        obj = this.flag_dw('');
        break;
      default:
        throw new Error(`unhandled type: ${type}`);
    }
    return obj.interpretReadResponse(response);
  }
}
/**
 * A DataFormat, which encodes/decodes data with MessagePack (see http://msgpack.org)
 */
class MsgpackDataFormat {
  /** Method to encode objects before they are written to the database */
  jsToBinary(obj) {
    // TODO there must be a better way to do this
    let buffer = msgpack.encode(obj);
    let res = new ByteBuffer();
    res.append(buffer);
    res.flip();
    return res;
  }
  /** Inverse of jsToBinary */
  binaryToJs(byteBuffer) {
    if (byteBuffer.remaining() <= 0) {
      return null;
    }
    let buffer = new Buffer(byteBuffer.toArrayBuffer());
    let decoded = msgpack.decode(buffer);
    return decoded;
  }
}
exports.MsgpackDataFormat = MsgpackDataFormat;
class ConnectionImpl extends CrdtFactoryImpl {
  constructor(conn) {
    super();
    /**
     * stores the last commit time.
     */
    this.lastCommitTimestamp = undefined;
    /**
     * The minimum snapshot version to use for new transactions.
     * This will be used when starting a new transaction in order to guarantee
     * session guarantees like monotonic reads and read-your-writes */
    this.minSnapshotTime = undefined;
    /**
     * Option, which determines if snapshots should be monotonic.
     * If set to `true`, this will update minSnapshotTime whenever
     * lastCommitTimestamp is updated
     */
    this.monotonicSnapshots = false;
    /*
    * The option, which determines, whether the clock should be 
    * updated for the specific transaction.
    */
    this.update_clock = true;
    /**
     * the default bucket used for newly created keys
     */
    this.defaultBucket = 'default-bucket';
    /**
     * The DataFormat to use for decoding and encoding binary values.
     * The default is [[MsgpackDataFormat]].
     */
    this.dataFormat = new MsgpackDataFormat();
    this.connection = conn;
  }
  getBucket() {
    return this.defaultBucket;
  }
  childUpdate(key, operation) {
    var op = {
      boundobject: key,
      operation: operation
    };
    return op;
  }
  /** Method to encode objects before they are written to the database */
  jsToBinary(obj) {
    return this.dataFormat.jsToBinary(obj);
  }
  /** Inverse of jsToBinary */
  binaryToJs(byteBuffer) {
    return this.dataFormat.binaryToJs(byteBuffer);
  }
  /** Sets the timout for requests */
  setTimeout(ms) {
    this.connection.requestTimeoutMs = ms;
  }
  /** Starts a new transaction */
  startTransaction() {
    return __awaiter(this, void 0, void 0, function*() {
      let apbStartTransaction = messageCodes_1.MessageCodes.antidotePb.ApbStartTransaction;
      let message = new apbStartTransaction(this.startTransactionPb());
      let resp = yield this.connection.sendRequest(
        messageCodes_1.MessageCodes.apbStartTransaction,
        encode(message)
      );
      if (resp.success) {
        return new TransactionImpl(this, resp.transaction_descriptor);
      }
      return Promise.reject(resp.errorcode);
    });
  }
  /**
   * returns the timestamp for the last commited transaction
   */
  getLastCommitTimestamp() {
    return this.lastCommitTimestamp;
  }
  setLastCommitTimestamp(lastCommitTimestamp) {
    this.lastCommitTimestamp = lastCommitTimestamp;
    if (this.monotonicSnapshots) {
      this.minSnapshotTime = lastCommitTimestamp;
    }
  }
  /**
   *
   * creates a startTransaction message with the last timestamp
   * and default transaction properties
   * set update_clock as 'false' if you don't want to update the timestamp;
   *
   */
  startTransactionPb() {
    return {
      timestamp: this.minSnapshotTime,
      properties: { update_snapshot: this.update_clock }
    };
  }
  /**
   * Reads several objects at once.
   * To read a single object, use the read method on that object.
   */
  readBatch(objects) {
    return __awaiter(this, void 0, void 0, function*() {
      let objects2 = objects;
      let messageType = messageCodes_1.MessageCodes.antidotePb.ApbStaticReadObjects;
      let message = new messageType({
        transaction: this.startTransactionPb(),
        objects: objects2.map(o => o.key)
      });
      let resp = yield this.connection.sendRequest(
        messageCodes_1.MessageCodes.apbStaticReadObjects,
        encode(message)
      );
      let cr = this.completeTransaction(resp.committime);
      let readResp = resp.objects;
      if (readResp.success) {
        let resVals = [];
        for (let i in objects2) {
          var obj = objects2[i];
          resVals.push(obj.interpretReadResponse(readResp.objects[i]));
        }
        this.lastCommitTimestamp = cr.commitTime;
        return Promise.resolve(resVals);
      } else {
        return Promise.reject(readResp.errorcode);
      }
    });
  }
  /**
   * Reads several objects at once.
   * The objects are stored in an object.
   * Returns a new object with the read values stored under the same field in the object.
   *
   * 		let objA = connection.counter("batch-object-read counter a")
   *		let objB = connection.register<string>("batch-object-read register b")
   *
   *		let vals = await connection.readObjectsBatch({
   *			a: objA,
   *			b: objB
   *		});
   *		// could return: {a: 1, b: "hi"}
   *
   * Hint: To read a single object, use the read method on that object.
   */
  readObjectsBatch(objects) {
    return __awaiter(this, void 0, void 0, function*() {
      let messageType = messageCodes_1.MessageCodes.antidotePb.ApbStaticReadObjects;
      let keys = Object.keys(objects);
      let objectArray = keys.map(key => objects[key]);
      let results = yield this.readBatch(objectArray);
      let resObj = {};
      for (let i in keys) {
        let key = keys[i];
        let result = results[i];
        resObj[key] = result;
      }
      return resObj;
    });
  }
  /**
   * Sends a single update operation or an array of update operations to Antidote.
   */
  update(updates) {
    return __awaiter(this, void 0, void 0, function*() {
      let messageType = messageCodes_1.MessageCodes.antidotePb.ApbStaticUpdateObjects;
      let updatesAr = updates instanceof Array ? updates : [updates];
      let message = new messageType({
        transaction: this.startTransactionPb(),
        updates: updatesAr
      });
      let resp = yield this.connection.sendRequest(
        messageCodes_1.MessageCodes.apbStaticUpdateObjects,
        encode(message)
      );
      return this.completeTransaction(resp);
    });
  }
  completeTransaction(resp) {
    if (resp.commit_time) {
      this.lastCommitTimestamp = resp.commit_time;
    }
    if (resp.success) {
      return {
        commitTime: resp.commit_time
      };
    }
    throw new Error(`Failed to commit transaction (Error code: ${resp.errorcode})`);
  }
  /**
   * Closes the connection to Antidote
   */
  close() {
    this.connection.close();
  }
}
class TransactionImpl extends CrdtFactoryImpl {
  constructor(conn, txId) {
    super();
    this.connection = conn;
    this.antidoteConnection = conn.connection;
    this.txId = txId;
  }
  getBucket() {
    return this.connection.getBucket();
  }
  jsToBinary(obj) {
    return this.connection.jsToBinary(obj);
  }
  binaryToJs(byteBuffer) {
    return this.connection.binaryToJs(byteBuffer);
  }
  childUpdate(key, operation) {
    return this.connection.childUpdate(key, operation);
  }
  /**
   * Reads several objects at once.
   */
  readBatch(objects) {
    return __awaiter(this, void 0, void 0, function*() {
      let objects2 = objects;
      let apb = messageCodes_1.MessageCodes.antidotePb.ApbReadObjects;
      let message = new apb({
        boundobjects: objects2.map(o => o.key),
        transaction_descriptor: this.txId
      });
      let resp = yield this.antidoteConnection.sendRequest(
        messageCodes_1.MessageCodes.apbReadObjects,
        encode(message)
      );
      if (resp.success) {
        let resVals = [];
        for (let i in objects2) {
          var obj = objects2[i];
          let objVal = obj.interpretReadResponse(resp.objects[i]);
          resVals.push(objVal);
        }
        return resVals;
      }
      return Promise.reject(resp.errorcode);
    });
  }
  /**
   * Reads several objects at once.
   */
  readObjectsBatch(objects) {
    return __awaiter(this, void 0, void 0, function*() {
      let messageType = messageCodes_1.MessageCodes.antidotePb.ApbStaticReadObjects;
      let keys = Object.keys(objects);
      let objectArray = keys.map(key => objects[key]);
      let results = yield this.readBatch(objectArray);
      let resObj = {};
      for (let i in keys) {
        let key = keys[i];
        let result = results[i];
        resObj[key] = result;
      }
      return resObj;
    });
  }
  /**
   * Sends a single update operation or an array of update operations to Antidote.
   */
  update(updates) {
    return __awaiter(this, void 0, void 0, function*() {
      let messageType = messageCodes_1.MessageCodes.antidotePb.ApbUpdateObjects;
      let updatesAr = updates instanceof Array ? updates : [updates];
      let message = new messageType({
        transaction_descriptor: this.txId,
        updates: updatesAr
      });
      yield this.antidoteConnection.sendRequest(
        messageCodes_1.MessageCodes.apbUpdateObjects,
        encode(message)
      );
    });
  }
  commit() {
    return __awaiter(this, void 0, void 0, function*() {
      let apbCommitTransaction = messageCodes_1.MessageCodes.antidotePb.ApbCommitTransaction;
      let message = new apbCommitTransaction({
        transaction_descriptor: this.txId
      });
      let resp = yield this.antidoteConnection.sendRequest(
        messageCodes_1.MessageCodes.apbCommitTransaction,
        encode(message)
      );
      return this.connection.completeTransaction(resp);
    });
  }
  abort() {
    return __awaiter(this, void 0, void 0, function*() {
      let apbAbortTransaction = messageCodes_1.MessageCodes.antidotePb.ApbAbortTransaction;
      let message = new apbAbortTransaction({
        transaction_descriptor: this.txId
      });
      let resp = yield this.antidoteConnection.sendRequest(
        messageCodes_1.MessageCodes.apbAbortTransaction,
        encode(message)
      );
    });
  }
  toString() {
    return `Transaction ${this.txId.toBinary()}`;
  }
}
class AntidoteObjectImpl {
  constructor(conn, key, bucket, type) {
    this.parent = conn;
    this.key = {
      key: ByteBuffer.fromUTF8(key),
      bucket: ByteBuffer.fromUTF8(bucket),
      type: type
    };
  }
  makeUpdate(operation) {
    return this.parent.childUpdate(this.key, operation);
  }
  read() {
    return __awaiter(this, void 0, void 0, function*() {
      let r = yield this.parent.readBatch([this]);
      return r[0];
    });
  }
}
class CrdtCounterImpl extends AntidoteObjectImpl {
  interpretReadResponse(readResponse) {
    return readResponse.counter.value;
  }
  /** Creates an operation to increment the counter.
   * Negative numbers will decrement the value.
   * Use [[[[Connection.update]]]] to send the update to the database. */
  increment(amount) {
    let amountL = amount instanceof Long ? amount : Long.fromNumber(amount);
    return this.makeUpdate({
      counterop: {
        inc: amountL
      }
    });
  }
}
class CrdtFlagImpl extends AntidoteObjectImpl {
  interpretReadResponse(readResponse) {
    return readResponse.flag.value;
  }
  /** Creates an operation to set the flag to the given value.
   * Use [[Connection.update]] to send the update to the database. */
  set(value) {
    return this.makeUpdate({
      flagop: {
        value: value
      }
    });
  }
}
class CrdtRegisterImpl extends AntidoteObjectImpl {
  interpretReadResponse(readResponse) {
    let bin = readResponse.reg.value;
    return this.parent.binaryToJs(bin);
  }
  /** Creates an operation, which sets the register to the provided value.
   *
   * Use [[Connection.update]] to send the update to the database. */
  set(value) {
    let bin = this.parent.jsToBinary(value);
    return this.makeUpdate({
      regop: {
        value: bin
      }
    });
  }
}
class CrdtMultiValueRegisterImpl extends AntidoteObjectImpl {
  interpretReadResponse(readResponse) {
    let bins = readResponse.mvreg.values;
    let res = bins.map(bin => this.parent.binaryToJs(bin));
    return res;
  }
  /** Creates an operation, which sets the register to the provided value.
   * Negative numbers will decrement the value.
   * Use [[Connection.update]] to send the update to the database. */
  set(value) {
    let bin = this.parent.jsToBinary(value);
    return this.makeUpdate({
      regop: {
        value: bin
      }
    });
  }
}
class CrdtSetImpl extends AntidoteObjectImpl {
  interpretReadResponse(readResponse) {
    let vals = readResponse.set.value;
    return vals.map(bin => {
      return this.parent.binaryToJs(bin);
    });
  }
  /**
   * Creates an operation, which adds an element to the set.
   * Use [[Connection.update]] to send the update to the database. */
  add(elem) {
    return this.makeUpdate({
      setop: {
        optype: 1 /* ADD */,
        adds: [this.parent.jsToBinary(elem)],
        rems: []
      }
    });
  }
  /**
   * Creates an operation, which adds several elements to the set.
   * Use [[Connection.update]] to send the update to the database. */
  addAll(elems) {
    return this.makeUpdate({
      setop: {
        optype: 1 /* ADD */,
        adds: elems.map(elem => this.parent.jsToBinary(elem)),
        rems: []
      }
    });
  }
  /**
   * Creates an operation, which removes an element from the set.
   * Use [[Connection.update]] to send the update to the database. */
  remove(elem) {
    return this.makeUpdate({
      setop: {
        optype: 2 /* REMOVE */,
        adds: [],
        rems: [this.parent.jsToBinary(elem)]
      }
    });
  }
  /**
   * Creates an operation, which removes several elements from the set.
   * Use [[Connection.update]] to send the update to the database. */
  removeAll(elems) {
    return this.makeUpdate({
      setop: {
        optype: 2 /* REMOVE */,
        adds: [],
        rems: elems.map(elem => this.parent.jsToBinary(elem))
      }
    });
  }
}
class CrdtMapValueImpl {
  constructor(factory, entries) {
    this.factory = factory;
    this.entries = entries;
  }
  get(key, type) {
    for (let entry of this.entries) {
      let entryKey = entry.key;
      if (entryKey.type === type && entryKey.key.toUTF8() === key) {
        return this.factory.readResponseToValue(type, entry.value);
      }
    }
    return undefined;
  }
  counterValue(key) {
    return this.get(key, 3 /* COUNTER */);
  }
  setValue(key) {
    return this.get(key, 4 /* ORSET */);
  }
  registerValue(key) {
    return this.get(key, 5 /* LWWREG */);
  }
  mvRegisterValue(key) {
    return this.get(key, 6 /* MVREG */);
  }
  gmapValue(key) {
    return this.get(key, 8 /* GMAP */);
  }
  rwsetValue(key) {
    return this.get(key, 10 /* RWSET */);
  }
  flag_ewValue(key) {
    return this.get(key, 13 /* FLAG_EW */);
  }
  flag_dwValue(key) {
    return this.get(key, 14 /* FLAG_DW */);
  }
  toJsObject() {
    let res = {};
    for (let entry of this.entries) {
      let type = entry.key.type;
      let value = this.factory.readResponseToValue(type, entry.value);
      if (value instanceof CrdtMapValueImpl) {
        value = value.toJsObject();
      }
      res[entry.key.key.toUTF8()] = value;
    }
    return res;
  }
}
class CrdtMapImpl extends CrdtFactoryImpl {
  constructor(conn, key, bucket, type) {
    super();
    this.parent = conn;
    this.key = {
      key: ByteBuffer.fromUTF8(key),
      bucket: ByteBuffer.fromUTF8(bucket),
      type: type
    };
  }
  childUpdate(key, operation) {
    return this.makeUpdate({
      mapop: {
        updates: [
          {
            key: {
              key: key.key,
              type: key.type
            },
            update: operation
          }
        ],
        removedKeys: []
      }
    });
  }
  makeUpdate(operation) {
    return this.parent.childUpdate(this.key, operation);
  }
  interpretReadResponse(readResponse) {
    let vals = readResponse.map.entries;
    return new CrdtMapValueImpl(this.parent, vals);
  }
  read() {
    return __awaiter(this, void 0, void 0, function*() {
      let r = yield this.parent.readBatch([this]);
      return r[0];
    });
  }
  getBucket() {
    return '';
  }
  readBatch(objects) {
    return __awaiter(this, void 0, void 0, function*() {
      let objects2 = objects;
      let r = yield this.parent.readBatch([this]);
      let map = r[0];
      let values = [];
      // filter out the actual keys
      for (let obj of objects2) {
        values.push(map.get(obj.key.key.toUTF8(), obj.key.type));
      }
      return values;
    });
  }
  jsToBinary(obj) {
    return this.parent.jsToBinary(obj);
  }
  binaryToJs(byteBuffer) {
    return this.parent.binaryToJs(byteBuffer);
  }
  remove(object) {
    return this.removeAll([object]);
  }
  removeAll(objects) {
    let objects2 = objects;
    let removedKeys = objects2.map(obj => {
      return {
        key: obj.key.key,
        type: obj.key.type
      };
    });
    return this.makeUpdate({
      mapop: {
        updates: [],
        removedKeys: removedKeys
      }
    });
  }
}
//# sourceMappingURL=antidote.js.map
