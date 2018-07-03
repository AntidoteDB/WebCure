# Pseudocode 

In this document, the overview of the solution is going to be represented. 

First of all, let's briefly describe the key components:

**Web Application:**

This is a client application, which runs in the web-browser and supports interactive commands from the user. It sits on top of the database layer.

- *read(key)* - asynchronous function that pulls database changes with an optional parameter to pull changes by *key*.
- *update(key, op, param)* - asynchronous function that processes user-made update.

**Server**

It is a configured AntidoteDB server that supports the following scenarios:

- receiving an operation performed on a CRDT-object;
- applying received operation on the server;
- sending back to the client the state of requested  CRDT-object / objects according to their state on the server;
- sending back states of all stored CRDT-objects, if specific object was not asked for;

**A database layer:**

This layer consists of the two databases - *Main database* and *Temp database*.

- Main database: this database stores CRDT states;
- Temp database: this database stores user-added operations on CRDT-objects, which are stored in the main database; 

When a user performs *read* operation by some *key*, the following actions are taking place:

1. Firstly, the state of the object ***O*** is going to be found by ***key*** in the *Main database*
2. Then from the *Temporary database*, operations ***o*** performed on the object ***O*** are found.
3. Afterwards, operations ***o*** are applied on the object ***O***.
4. And the object from step *3* is returned back as a response to the application.

 

![Workflow](./img/diagram.svg)



#### The client is offline 

![Workflow](./img/offline.svg)

###### start() function 

````pseudocode
function start(){
    read(); // read the latest changes.
    
    // add listener to the button, for event 'onclick' (when the user tries to add new changes)
    addButton.addEventListener('onclick', callback);

	callback = function(){
        update();   
	}
}
````

###### read() function 

```pseudocode
// Read function that pulls database changes
// @param key: the key of the object, for which the update was requested; 

function read(key) {
    responseArray = []; // define an empty array, which is going to be sent back
    
    state = get state of object by key from the main database
    operations = get operations performed on the object o from the temp database
    
    response = apply operations over the state
    responseArray.push(response);
    
    return reponseArray;
}
```

###### update() function 

````pseudocode
// update function that processes user-made update
// @param key
// @param op: operation performed on the object under the key
// TODO: add the support for multiple changes also!
function update(key, op){
    if (key is found in the main database){
        add op to the temp database for the found key;
    }
    else {
        newop = create a key;
        add newop to the temp database;
        add op to the temp database for the key;
        // or maybe we can just notify the user that there is no such key in the main database
    }
    
    return responseStatus;
}
````

#### The client is online

![Workflow](./img/online.svg)

###### start() function 

````pseudocode
function start(){
    read(); // read the latest changes.
    
    // add listener to the button, for event 'onclick' (when the user tries to add new changes)
    addButton.addEventListener('onclick', callback);

	callback = function(){
        update();   
	}
}
````

###### read() function

````pseudocode
// Read function that pulls database changes
// @param key: the key of the object, for which the update was requested; if undefined, then all changes will be pulled

function read(key){
     responseArray = []; // define an empty array, which is going to be sent back
    
     connect(key);
     state = get state of object by key from the main database
     response = object that contains the key and the value
     responseArray.push(response);
     return reponseArray;
}
````

###### update() function 

```` fdsf 
// update function that processes user-made update
// @param key
// @param op: operation performed on the object under the key
// TODO: add the support for multiple changes also!
function update(key, op){
	add op to the temp database for the found key;
    connect();
    return responseStatus;
}
````

###### connect() function

````pseudocode
function connect(key){	
	sumbit operations from temp databases to the server;
	wait for them to apply on the server's side

	make a request to the server for the state of object under the key
	state = received state;
	
	in the main database update the state of object under the key
	clean temporary database;
}
````
