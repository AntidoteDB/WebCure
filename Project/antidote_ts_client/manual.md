# Installation

The library is available as an [npm package](https://www.npmjs.com/package/antidote_ts_client).
Run the following command to add it as a dependency to your project:

    npm install --save antidote_ts_client

# Source Code

The source code for this library and for this documentation is available on [GitHub](https://github.com/syncfree/antidote_ts_client).

# Usage

You can import the library into your js application using `require`:

    let antidoteClient = require('antidote_ts_client')

To connect to Antidote, use the [[connect]] function, which takes the port and the hostname.

    let antidote = antidoteClient.connect(8087, "localhost")

The [[connect]] function returns a [[Connection]] object.

## Antidote-Objects

Objects in the database are addressed using immutable references of type [[AntidoteObject]], which can be retrieved using methods on the connection object.
Each datatype supported by Antidote has its own method.
For example a reference to a set datatype stored under key "users" can be retrieved as follows:

    let userSet = antidote.set("users")

A list of available types can be found in the [[CrdtFactory]] interface, which is implemented by the [[Connection]] object.	

## Reading objects

Each [[AntidoteObject]] has a [[AntidoteObject.read|read]] method, which retrieves the current value of the object from the database.
The result is returned as a `Promise`, so the `then` method can be used to execute some action when the result is available:

    userSet.read().then(users => {
        // do something with the list of users
    }

For reading multiple objects simultaneously, the Antidote [[Connection]] object provides the [[AntidoteSession.readBatch|readBatch]] and a [[AntidoteSession.readObjectsBatch|readObjectsBatch]] methods.
[[AntidoteSession.readBatch|readBatch]]  takes a list of objects to read and returns a list of read values.
[[AntidoteSession.readObjectsBatch|readObjectsBatch]] does the same for an object with key-value pairs.

## Updating objects

Each [[AntidoteObject]] has one or more methods to create update operations.
These update operations can be commited to the database, using the [[AntidoteSession.update|update]] method on the [[Connection]] object, which takes a single update operation or a list of update operations.

    antidote.update(
        userSet.add(username)
    ).then(resp => 
        // stored successfully
    )

Note that `userSet.add(username)` just creates the operation, but does **not** execute it.
It is only executed when passed to the [[AntidoteSession.update|update]] method.

The [[AntidoteSession.update|update]] method can also be used with a list of update operations. 
In that case all transactions will be executed atomically as a batch operation:

	let counter1 = antidote.counter("counter1")
	let counter2 = antidote.counter("counter2")
	// update both counters simultaneously:
	antidote.update([
        counter1.increment(1),
		counter2.increment(1)
    ]).then(resp => 
        // stored successfully
    )


## Use with async-await

All operations are asynchronous and return Promises.
With recent versions of JavaScript, or with compilation using Babel or TypeScript it is possible to use the API with `async` and `await` to make it more readable.

    let users = await userSet.read()
    // do something with the list of users
    await antidote.update(
        userSet.add(username)
    )
    // stored successfully



## Buckets

Keys in Antidote are grouped into so called buckets.
The currently used bucket is stored in the [[Connection.defaultBucket]] field of the connection object.
The default value is "default-bucket", but the field can be overwritten to use different buckets. 


## Serialization

When JavaScript objects are stored in Antidote, they have to be converted to binary data.
When reading the object, the binary data has to be converted back to JavaScript.

This is done using the [[DataFormat]] stored in [[Connection.dataFormat]] of the connection object.
By default [MessagePack](http://msgpack.org) is used.
The behavior can be adjusted by implementing an own [[DataFormat]] and setting the field.

For example the following code changes the format to use JSON:

```
antidote.dataFormat = {
    jsToBinary: (obj) => ByteBuffer.fromUTF8(JSON.stringify(obj)),
    binaryToJs: (byteBuffer: ByteBuffer) => {
        if (byteBuffer.remaining() == null) {
            return null;
        }
        let str = byteBuffer.readUTF8String(byteBuffer.remaining());
        return JSON.parse(str);
    }
}
```



## Session guarantees

To ensure session guarantees like "read your writes" Antidote uses vector clocks.
Each operation returns a vector clock indicating the time after the operation.
At each request to Antidote a vector clock can be given to force a minimum time for the snapshot used in the request.

This library always stores the latest returned vector clock and makes it available via the [[Connection.getLastCommitTimestamp|getLastCommitTimestamp]] method on the connection object.

When a transaction or operation is started the vector clock in the [[Connection.minSnapshotTime|minSnapshotTime]] field is used as the minimum snapshot time.
When [[Connection.monotonicSnapshots|monotonicSnapshots]] is set to `true`, the clock of [[Connection.minSnapshotTime|minSnapshotTime]] will automatically be updated if the last commit timestamp is updated.



## Transactions


A transaction can be started with the [[startTransaction]] method on the connection object.
This gives a [[Transaction]] object, which provides a similar interface to the main `antidote` [[Connection]] object.
In addition there is a [[commit]] method to commit the transaction.


    let tx = await antidote.startTransaction()
    // create object reference bound to the transaction:
    let reg = tx.multiValueRegister<number>("some-key");
    
    // read the register in the transaction:
    let vals = await reg.read();
    
    // update the register based on current values 
    let newval = f(vals) 
    await tx.update(
        reg.set(newval)
    )
    await tx.commit()

Inside a transaction you have to be careful to only read objects bound to the transactions and only use the update method of the transaction.
Otherwise the operations will be executed outside of the transaction context.

