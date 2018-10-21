"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
require("mocha");
const antidote_1 = require("./antidote");
const ByteBuffer = require("bytebuffer");
var Long = require("long");
describe("antidote client", function () {
    // 60 second timeout, because travis sometimes needs longer
    let timeout = 60000;
    this.timeout(timeout);
    let connection;
    before(() => {
        connection = antidote_1.connect(8087, "localhost");
        // use random buckets, so that we can rerun the tests without cleaning and restarting antidote
        connection.defaultBucket = "testbucket" + Math.random();
        connection.setTimeout(timeout);
    });
    let counterImpls = [
        { name: "counter", create: (name) => connection.counter(name) },
        { name: "fat-counter", create: (name) => connection.fatCounter(name) },
    ];
    for (let impl of counterImpls) {
        describe(impl.name, () => {
            it('should count', () => __awaiter(this, void 0, void 0, function* () {
                let counter = impl.create(`my${impl.name}`);
                yield connection.update(counter.increment(3));
                let val = yield counter.read();
                assert.equal(val, 3);
            }));
            it('should be able to decrement', () => __awaiter(this, void 0, void 0, function* () {
                let counter = impl.create(`my${impl.name}_dec`);
                yield connection.update(counter.increment(-1));
                let val = yield counter.read();
                assert.equal(val, -1);
            }));
        });
    }
    describe('fat-counters', () => {
        it('should count', () => __awaiter(this, void 0, void 0, function* () {
            let counter = connection.fatCounter("myFatCounter");
            yield connection.update(counter.increment(3));
            let val = yield counter.read();
            assert.equal(val, 3);
        }));
    });
    describe('flags', () => {
        it('can be set', () => __awaiter(this, void 0, void 0, function* () {
            let flag = connection.flag_ew("my_flag_ew");
            assert.equal(yield flag.read(), false);
            yield connection.update(flag.set(true));
            assert.equal(yield flag.read(), true);
            yield connection.update(flag.set(false));
            assert.equal(yield flag.read(), false);
        }));
    });
    describe('last-writer-wins register', () => {
        it('can be used to store and read values', () => __awaiter(this, void 0, void 0, function* () {
            let reg = connection.register("mylwwreg");
            yield connection.update(reg.set(["a", "b"]));
            let val = yield reg.read();
            assert.deepEqual(val, ["a", "b"]);
        }));
    });
    describe('multi-value register', () => __awaiter(this, void 0, void 0, function* () {
        it('can be used to store and read values', () => __awaiter(this, void 0, void 0, function* () {
            let reg = connection.multiValueRegister("mymvreg");
            yield connection.update(reg.set(15));
            let val = yield reg.read();
            assert.deepEqual(val, [15]);
        }));
    }));
    let setTypes = [
        {
            name: 'add-wins',
            create: (name) => connection.set(name)
        },
        {
            name: 'remove-wins',
            create: (name) => connection.set_removeWins(name)
        }
    ];
    for (let setType of setTypes) {
        describe(`${setType.name}-sets`, () => {
            it('can be used to add elements', () => __awaiter(this, void 0, void 0, function* () {
                let set = setType.create(`${setType.name}-set1`);
                yield connection.update([
                    set.add("x"),
                    set.addAll(["y", [1, 2, 3]])
                ]);
                let val = yield set.read();
                assert.deepEqual(val, [[1, 2, 3], "x", "y"]);
            }));
            it('should work with add and remove', () => __awaiter(this, void 0, void 0, function* () {
                let set = setType.create(`${setType.name}-set2`);
                yield connection.update(set.addAll(["a", "b", "c", "d", "e"]));
                yield connection.update([
                    set.remove("a"),
                    set.removeAll(["b", "c"])
                ]);
                let val = yield set.read();
                assert.deepEqual(val, ["d", "e"]);
            }));
        });
    }
    describe('grow-only map', () => {
        it('should be possible to store things', () => __awaiter(this, void 0, void 0, function* () {
            let map = connection.gmap("my-gmap");
            yield connection.update([
                map.register("a").set("x"),
                map.counter("b").increment(5)
            ]);
            let val = yield map.read();
            let obj = val.toJsObject();
            assert.deepEqual(obj, { a: "x", b: 5 });
        }));
    });
    describe('remove-resets map', () => {
        it('should be possible to store things', () => __awaiter(this, void 0, void 0, function* () {
            let map = connection.rrmap("my-rrmap1");
            yield connection.update([
                map.register("a").set("x"),
                map.counter("b").increment(5),
                map.rrmap("c").multiValueRegister("d").set("e")
            ]);
            let val = yield map.read();
            let obj = val.toJsObject();
            assert.deepEqual(obj, { a: "x", b: 5, c: { d: ["e"] } });
        }));
        it('should be possible to store and then remove things', () => __awaiter(this, void 0, void 0, function* () {
            let map = connection.rrmap("my-rrmap2");
            yield connection.update([
                map.multiValueRegister("a").set("x"),
                map.multiValueRegister("b").set("x"),
                map.multiValueRegister("c").set("x"),
                map.multiValueRegister("d").set("x"),
                map.set("e").addAll([1, 2, 3, 4]),
                map.counter("f").increment(5)
            ]);
            yield connection.update([
                map.remove(map.multiValueRegister("a")),
                map.removeAll([map.multiValueRegister("b"), map.multiValueRegister("c")])
            ]);
            let val = yield map.read();
            let obj = val.toJsObject();
            assert.deepEqual(obj, { d: ["x"], e: [1, 2, 3, 4], f: 5 });
        }));
    });
    describe('transactions', () => {
        it('can read and update', () => __awaiter(this, void 0, void 0, function* () {
            let tx = yield connection.startTransaction();
            let reg = tx.multiValueRegister("tr-reg");
            let vals = yield reg.read();
            let max = 0;
            for (let n of vals) {
                if (n > max) {
                    max = n;
                }
            }
            yield tx.update(reg.set(max + 1));
            yield tx.commit();
            let reg2 = connection.multiValueRegister("tr-reg");
            let vals2 = yield reg2.read();
            assert.deepEqual(vals2, [1]);
        }));
        it('can abort transaction', () => __awaiter(this, void 0, void 0, function* () {
            let tx = yield connection.startTransaction();
            let reg = tx.multiValueRegister("tr-reg2");
            let vals = yield reg.read();
            let max = 0;
            for (let n of vals) {
                if (n > max) {
                    max = n;
                }
            }
            yield tx.update(reg.set(max + 1));
            yield tx.abort();
            // no change:
            let reg2 = connection.multiValueRegister("tr-reg2");
            let vals2 = yield reg2.read();
            assert.deepEqual(vals2, []);
        }));
        it('can do batch-reads', () => __awaiter(this, void 0, void 0, function* () {
            let a = connection.counter("batch-read-counter-a");
            let b = connection.counter("batch-read-counter-b");
            let c = connection.counter("batch-read-counter-c");
            yield connection.update([
                a.increment(1),
                b.increment(2),
                c.increment(3)
            ]);
            let vals = yield connection.readBatch([a, b, c]);
            vals.sort(); // TODO remove this when order is fixed in Antidote
            assert.deepEqual(vals, [1, 2, 3]);
        }));
        it('can do big batch-reads', () => __awaiter(this, void 0, void 0, function* () {
            let registers = [];
            for (let i = 0; i < 1000; i++) {
                registers.push(connection.register(`batch-reg-${i}`));
            }
            let longStr = "a".repeat(165537);
            yield connection.update(registers.map(r => r.set(longStr)));
            let vals = yield connection.readBatch(registers);
            assert.equal(vals.length, registers.length);
            for (let i = 0; i < 1000; i++) {
                assert.equal(vals[i], longStr);
            }
        }));
        it('can do batch-reads object api', () => __awaiter(this, void 0, void 0, function* () {
            let objA = connection.counter("batch-object-read counter a");
            let objB = connection.register("batch-object-read register b");
            yield connection.update([
                objA.increment(1),
                objB.set("hi")
            ]);
            let vals = yield connection.readObjectsBatch({
                a: objA,
                b: objB
            });
            assert.deepEqual(vals, { a: 1, b: "hi" });
        }));
    });
    describe("corner cases", () => {
        it('can read empty registers', () => __awaiter(this, void 0, void 0, function* () {
            let x = connection.register("empty-register-1");
            let val = yield x.read();
            assert.equal(val, null);
        }));
        it('can write null', () => __awaiter(this, void 0, void 0, function* () {
            let x = connection.register("null-test-register");
            yield x.set(null);
            let val = yield x.read();
            assert.equal(val, null);
        }));
        it('can read empty registers in batch', () => __awaiter(this, void 0, void 0, function* () {
            let x = connection.register("empty-register-2");
            let y = connection.register("empty-register-3");
            let vals = yield connection.readBatch([x, y]);
            assert.deepEqual(vals, [null, null]);
        }));
    });
    // example from antidote tutorial
    describe("tutorial example", () => {
        it('tutorial example', () => __awaiter(this, void 0, void 0, function* () {
            let connection = antidote_1.connect(8087, "localhost");
            let set = connection.set("set");
            {
                let tx = yield connection.startTransaction();
                yield tx.update(set.remove("Java"));
                yield tx.update(set.add("Kotlin"));
                yield tx.commit();
            }
            {
                let tx = yield connection.startTransaction();
                let f1 = tx.update(set.remove("Java"));
                let f2 = tx.update(set.add("Kotlin"));
                yield f1;
                yield f2;
                yield tx.commit();
            }
            {
                yield connection.update([
                    set.remove("Java"),
                    set.add("Kotlin")
                ]);
            }
            let tx = yield connection.startTransaction();
            let value = yield set.read();
            yield tx.update(set.add("Java"));
            yield tx.commit();
            connection.defaultBucket = "user_bucket";
            let user1 = connection.set("michael");
            yield connection.update(user1.addAll(["Michel", "michel@blub.org"]));
            let res = yield user1.read();
        }));
    });
    describe("message formats", () => {
        it('can use custom formats', () => __awaiter(this, void 0, void 0, function* () {
            let oldFormat = connection.dataFormat;
            connection.dataFormat = {
                jsToBinary: (obj) => ByteBuffer.fromUTF8(JSON.stringify(obj)),
                binaryToJs: (byteBuffer) => {
                    if (byteBuffer.remaining() == null) {
                        return null;
                    }
                    let str = byteBuffer.readUTF8String(byteBuffer.remaining());
                    return JSON.parse(str);
                }
            };
            let x = connection.register("json-register");
            let obj = { a: 7, b: "hello" };
            yield connection.update(x.set(obj));
            let obj2 = yield x.read();
            assert.deepEqual(obj2, obj);
            connection.dataFormat = oldFormat;
        }));
    });
});
//# sourceMappingURL=test.js.map