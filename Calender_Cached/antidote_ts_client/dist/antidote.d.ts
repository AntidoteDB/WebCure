/// <reference types="bytebuffer" />
/// <reference types="long" />
import '../proto/antidote_proto';
import ByteBuffer = require("bytebuffer");
import * as Long from "long";
/** Connects to antidote on the given port and hostname
 * @param port the port number of Antidote's protocol buffer port (for example 8087)
 * @param host the host running Antidote (for example "localhost")
 */
export declare function connect(port: number, host: string): Connection;
/**
 * A CRDT factory is used to create references to stored objects.
 * These references are linked to the factory from which they were created.
 *
 * There are three kind of factories: the [[Connection]], [[Transaction]]s and [[CrdtMap]]s.
 *
 */
export interface CrdtFactory {
    /** returns a reference to a counter object */
    counter(key: string): CrdtCounter;
    /** returns a reference to a fat_counter object */
    fatCounter(key: string): CrdtCounter;
    /** returns a reference to a last-writer-wins register */
    register<T>(key: string): CrdtRegister<T>;
    /** returns a reference to a multi-value register */
    multiValueRegister<T>(key: string): CrdtMultiValueRegister<T>;
    /** returns a reference to an enable-wins flag object */
    flag_ew(key: string): CrdtFlag;
    /** returns a reference to an disable-wins flag object */
    flag_dw(key: string): CrdtFlag;
    /** returns a reference to an add-wins set object */
    set<T>(key: string): CrdtSet<T>;
    /** returns a reference to a remove-wins set object */
    set_removeWins<T>(key: string): CrdtSet<T>;
    /** returns a reference to a remove-resets map */
    rrmap(key: string): CrdtMap;
    /** returns a reference to a grow-only map */
    gmap(key: string): CrdtMap;
}
/**
 * An `AntidoteSession` is an interface to Antidote, which can be used to read and update values.
 *
 * There are two possible sessions:
 *
 *  - The [[Connection]] for reads and updates which are not part of interactive transactions.
 *  - [[Transaction]] for performing reads and updates within an interactive transaction.
 */
export interface AntidoteSession extends CrdtFactory {
    /**
     * Takes an array of objects and reads the value of all objects in one batch operation.
     * Returns a promise to an array of values in the same order.
     *
     * Hint: To read a single object, use the read method on that object.
     */
    readBatch(objects: AntidoteObject<any>[]): Promise<any[]>;
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
    readObjectsBatch<T>(objects: {
        [K in keyof T]: AntidoteObject<T[K]>;
    }): Promise<{
        [K in keyof T]: T[K];
    }>;
    /**
     * Sends a single update operation or an array of update operations to Antidote.
     * If an array of updates is given, all updates in the array are executed atomically.
     */
    update(updates: AntidotePB.ApbUpdateOp[] | AntidotePB.ApbUpdateOp): Promise<any>;
}
/** A connection to AntidoteDB with methods for reading, updating and starting transactions.
 * Use the [[connect]] function to obtain a `Connection`.
 *
 * The Connection can then be used as a [[CrdtFactory]] to create references to database objects.
 *
 * The [[readBatch]] and [[update]] methods can be used to perform reads and updates.
 *
 * Example:
 *
 * ```
 * let antidote = antidoteClient.connect(8087, "localhost")
 * // create a reference to a set object:
 * let userSet = antidote.set("users")
 * // read the value of the set
* let val = await userSet.read()
 * // update the set:
 * await antidote.update(userSet.add("Hans"))
 *
 * ```
 *
 * The bucket can be configured via the property `defaultBucket`, it defaults to "default-bucket".
 *
 * Javascript objects stored in sets and registers are encoded using MessagePack (http://msgpack.org) by default.
 * You can override the [[jsToBinary]] and [[binaryToJs]] methods to customize this behavior.
 *
 */
export interface Connection extends AntidoteSession {
    /**
     * The minimum snapshot version to use for new transactions.
     * This will be used when starting a new transaction in order to guarantee
     * session guarantees like monotonic reads and read-your-writes */
    minSnapshotTime: ByteBuffer | undefined;
    /**
     * Option, which determines if snapshots should be monotonic.
     * If set to `true`, this will update minSnapshotTime whenever
     * lastCommitTimestamp is updated
     */
    monotonicSnapshots: boolean;
    /**
     * the default bucket used for newly created keys
     */
    defaultBucket: string;
    /**
     * The DataFormat to use for decoding and encoding binary values.
     * The default is [[MsgpackDataFormat]].
     */
    dataFormat: DataFormat;
    /** Method to encode objects before they are written to the database */
    jsToBinary(obj: any): ByteBuffer;
    /** Inverse of jsToBinary */
    binaryToJs(byteBuffer: ByteBuffer): any;
    /** Sets the timout for requests */
    setTimeout(ms: number): void;
    /** Starts a new transaction */
    startTransaction(): Promise<Transaction>;
    /**
     * returns the timestamp for the last commited transaction
     */
    getLastCommitTimestamp(): ByteBuffer | undefined;
    /**
     * Closes the connection to Antidote
     */
    close(): void;
}
/**
 * A DataFormat tells Antidote how JavaScript values should be stored in
 * the database (in Sets, Registers, Maps).
 * A DataFormat has to implement two functions jsToBinary and binaryToJs to convert between binary data and JavaScript values.
 *
 * The default implementation is [[MsgpackDataFormat]].
 */
export interface DataFormat {
    /** Method to encode objects before they are written to the database */
    jsToBinary(obj: any): ByteBuffer;
    /** Inverse of jsToBinary */
    binaryToJs(byteBuffer: ByteBuffer): any;
}
/**
 * A DataFormat, which encodes/decodes data with MessagePack (see http://msgpack.org)
 */
export declare class MsgpackDataFormat implements DataFormat {
    /** Method to encode objects before they are written to the database */
    jsToBinary(obj: any): ByteBuffer;
    /** Inverse of jsToBinary */
    binaryToJs(byteBuffer: ByteBuffer): any;
}
/**
 * A transaction can be used similar to a [[Connection]] to get references to database and objects
 * and to perform reads and updates.
 *
 * Example:
 * ```
 *     let tx = await antidote.startTransaction()
 *     // create object reference bound to the transaction:
 *     let reg = tx.multiValueRegister<number>("some-key");
 *
 *     // read the register in the transaction:
 *     let vals = await reg.read();
 *
 *     // update the register based on current values
 *     let newval = f(vals)
 *     await tx.update(
 *         reg.set(newval)
 *     )
 *     await tx.commit()
 * ```
 *
 */
export interface Transaction extends AntidoteSession {
    /**
     * Commits the transaction.
     */
    commit(): Promise<any>;
    /**
     * Aborts the transaction.
     */
    abort(): Promise<void>;
}
/**
 * An AntidoteObject is a reference to an object in the database and is bound to
 * the [[CrdtFactory]] which created the reference.
 *
 * For example, when a reference is created from a [[Transaction]] object,
 * all reads on the object will be performed in the context of the transaction.
 *
 * @param T the type returned when reading the object
 */
export interface AntidoteObject<T> {
    /** the parent factory */
    readonly parent: CrdtFactory;
    /**
     * reads the current value of the object
     **/
    read(): Promise<T>;
}
/**
 * A counter is a object that stores a single integer and can be incremented or decremented.
 *
 * Example:
 *
 * ```
 * let counter = connection.counter("myCounter")
 * await connection.update(
 * 	counter.increment(3)
 * );
 * let val = await counter.read();
 * ```
 *
 */
export interface CrdtCounter extends AntidoteObject<number> {
    /** Creates an operation to increment the counter.
     * Negative numbers will decrement the value.
     * Use [[Connection.update]] to send the update to the database. */
    increment(amount: number | Long): AntidotePB.ApbUpdateOp;
    /**
     * Reads the current value of the counter
     */
    read(): Promise<number>;
}
/**
 * A flag stores a boolean value, that can be changed
 *
 * ```
 * let flag = connection.flag_ew("myflag")
 * await connection.update(
 * 	flag.set(true)
 * )
 * let val = await flag.read();
 * ```
*/
export interface CrdtFlag extends AntidoteObject<boolean> {
    /** Creates an operation to set the flag to the given value.
     * Use [[Connection.update]] to send the update to the database. */
    set(value: boolean): AntidotePB.ApbUpdateOp;
}
/**
 * A register stores a single value.
 * It provides a [[set]] method to change the value.
 *
 * Example:
 *
 * ```
 * let reg = connection.register<string[]>("mylwwreg")
 * await connection.update(
 * 	reg.set(["a", "b"])
 * )
 * let val = await reg.read();
 * ```
 *
 * @param T the type of the value stored in the register
 */
export interface CrdtRegister<T> extends AntidoteObject<T> {
    /** Creates an operation, which sets the register to the provided value.
     * Use [[Connection.update]] to send the update to the database. */
    set(value: T): AntidotePB.ApbUpdateOp;
}
/**
 * This register can be [[set]] to a single value, but reading the register returns a list of
 * all concurrently written values.
 *
 * Example:
 *
 * ```
 * let reg = connection.multiValueRegister<number>("mymvreg")
 * await connection.update(
 * 	reg.set(15)
 * )
 * let val = await reg.read();
 * // val is now [15]
 * ```
 *
 * @param T the type of the value stored in the register
 */
export interface CrdtMultiValueRegister<T> extends AntidoteObject<T[]> {
    /** Creates an operation, which sets the register to the provided value.
     *
     * Use [[Connection.update]] to send the update to the database. */
    set(value: T): AntidotePB.ApbUpdateOp;
}
/**
 * A set of elements.
 * Elements can be added and removed.
 *
 * Example:
 * ```
 * let set = setType.create<string>("my-set")
 * await connection.update(
 * 	set.addAll(["a", "b", "c", "d", "e"])
 * )
 * await connection.update([
 * 	set.remove("a"),
 * 	set.removeAll(["b", "c"])
 * ])
 * let val = await set.read();
 * // val is now ["d", "e"]
 * ```
 *
 * @param T the type of the elements stored in the set
 */
export interface CrdtSet<T> extends AntidoteObject<T[]> {
    /**
     * Creates an operation, which adds an element to the set.
     * Use [[Connection.update]] to send the update to the database. */
    add(elem: T): AntidotePB.ApbUpdateOp;
    /**
     * Creates an operation, which adds several elements to the set.
     * Use [[Connection.update]] to send the update to the database. */
    addAll(elems: T[]): AntidotePB.ApbUpdateOp;
    /**
     * Creates an operation, which removes an element from the set.
     * Use [[Connection.update]] to send the update to the database. */
    remove(elem: T): AntidotePB.ApbUpdateOp;
    /**
     * Creates an operation, which removes several elements from the set.
     * Use [[Connection.update]] to send the update to the database. */
    removeAll(elems: T[]): AntidotePB.ApbUpdateOp;
}
/**
 * An object representing the value of a [[CrdtMap]].
 */
export interface CrdtMapValue {
    /**
     * reads the entry with the given key and type
     */
    get(key: string, type: AntidotePB.CRDT_type): any;
    /** reads the counter value with the given key */
    counterValue(key: string): number | undefined;
    /** reads the set value with the given key */
    setValue(key: string): any[] | undefined;
    /** reads the register value with the given key */
    registerValue(key: string): any;
    /** reads the multi-value-register value with the given key */
    mvRegisterValue(key: string): any[] | undefined;
    /** reads the gmap value with the given key */
    gmapValue(key: string): CrdtMapValue | undefined;
    /** reads the remove-wins-set value with the given key */
    rwsetValue(key: string): any[] | undefined;
    /** reads the flag_ew-value with the given key */
    flag_ewValue(key: string): boolean;
    /** reads the flag_dw-value with the given key */
    flag_dwValue(key: string): boolean;
    /**
     * Converts this CRDTMapValue into a JavaScript object.
     * The value of each embedded CRDT is stored under it's key.
     *
     * Warning: If there are two entries with the same keys but different types, then only one of them survives.
     * */
    toJsObject(): any;
}
/**
 * A map with embedded CRDTs.
 * Each map implements the [[CrdtFactory]] interface, so it can be used like a connection to create references to embedded objects.
 * The [[remove]] and [[removeAll]] methods can be used to remove entries from the map.
 *
 * Example:
 *
 * ```
 * let map = connection.map("my-map2");
 * await connection.update([
 * 	map.register("a").set("x"),
 * 	map.register("b").set("x"),
 * 	map.register("c").set("x"),
 * 	map.register("d").set("x"),
 * 	map.set("e").addAll([1, 2, 3, 4]),
 * 	map.counter("f").increment(5)
 * ])
 * await connection.update([
 * 	map.remove(map.register("a")),
 * 	map.removeAll([map.register("b"), map.register("c")])
 * ])
 * let val = await map.read();
 * // convert CrdtMapValue to JavaScript object:
 * let obj = val.toJsObject();
 * // obj is now { d: "x", e: [1, 2, 3, 4], f: 5 }
 * ```
 */
export interface CrdtMap extends AntidoteObject<CrdtMapValue>, CrdtFactory {
    /**
     * Creates an operation to remove an entry from the map.
     * Use [[Connection.update]] to send the update to the database.
     */
    remove(object: AntidoteObject<any>): AntidotePB.ApbUpdateOp;
    /**
     * Creates an operation to remove several entries from the map.
     * Use [[Connection.update]] to send the update to the database.
     */
    removeAll(objects: AntidoteObject<any>[]): AntidotePB.ApbUpdateOp;
}
