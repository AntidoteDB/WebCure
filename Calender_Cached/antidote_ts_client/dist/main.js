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
require("../proto/antidote_proto");
const antidote_1 = require("./antidote");
var Long = require("long");
let connection = antidote_1.connect(8087, "localhost");
function testAntidote() {
    return __awaiter(this, void 0, void 0, function* () {
        let tx = yield connection.startTransaction();
        let testKey = tx.counter("testKey");
        tx.update(testKey.increment(1));
        let counterValue = yield testKey.read();
        console.log(`counter value = ${counterValue}.`);
        return tx.commit();
    });
}
function testAntidote2() {
    return __awaiter(this, void 0, void 0, function* () {
        let counter = connection.counter("testKey");
        yield connection.update(counter.increment(1));
        let counterValue = yield counter.read();
        console.log(`counter value = ${counterValue}.`);
    });
}
function friendSet(userId) {
    return connection.set("friends_set_" + userId);
}
function makeFriends(userA, userB) {
    let friendsOfA = friendSet(userA.id);
    let friendsOfB = friendSet(userB.id);
    return connection.update([
        friendsOfA.add(userB.id),
        friendsOfB.add(userA.id)
    ]);
}
function friendshipExample() {
    return __awaiter(this, void 0, void 0, function* () {
        let alice = { id: "A", name: "Alice" };
        let bob = { id: "B", name: "Bob" };
        let charlie = { id: "C", name: "Charlie" };
        // // TODO reset not yet supported by antidote
        // connection.update([
        // 	friendSet(alice.id).reset(),
        // 	friendSet(bob.id).reset(),
        // 	friendSet(charlie.id).reset()
        // ])
        //reset state
        yield Promise.all([alice, bob, charlie].map((user) => __awaiter(this, void 0, void 0, function* () {
            let set = friendSet(user.id);
            let vals = yield set.read();
            yield connection.update(set.removeAll(vals));
        })));
        yield Promise.all([
            makeFriends(alice, bob),
            makeFriends(bob, charlie)
        ]);
        let resp = yield connection.readBatch([
            friendSet(alice.id),
            friendSet(bob.id),
            friendSet(charlie.id)
        ]);
        console.log(`Alice is friends with ${JSON.stringify(resp[0])}`);
        console.log(`Bob is friends with ${JSON.stringify(resp[1])}`);
        console.log(`Charlie is friends with ${JSON.stringify(resp[2])}`);
    });
}
let test = Promise.all([
    testAntidote(),
    testAntidote2(),
    friendshipExample()
]);
test.catch((err) => {
    console.log(`Error: ${err}`);
    connection.close();
});
test.then(() => {
    connection.close();
});
//# sourceMappingURL=main.js.map