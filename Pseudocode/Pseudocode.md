# Pseudocode 

In this document, the overview of the solution is going to be represented. 

First of all, let's briefly describe the key components:

###### Web Application:

This is a client application, which runs in the web-browser and supports interactive commands from the user. It sits on top of the database layer.

- *read(key)* - asynchronous function that pulls database changes with an optional parameter to pull changes by *key*. 

  - It receives a *state* object back according to the requested *key*.

- *update(key, op, param)* - asynchronous function that processes user-made update:

  - *key* - the key, which is going to be updated;

  - *op* - the operation, which is going to be performed on the *key*;

  - *param* - any additional parameters that might be needed;

  - It stores user-made operations on CRDT-states for a specific *key* in the following way:

    *{key, [op1, op2, op3, ... ]}* 

###### **Server**

It is a configured AntidoteDB server that supports the following scenarios:

- receiving an array of operations (*[{key, operation}, ..., ... ]*) performed on a CRDT-object (according to the key);
- applying received operations on the server;
- sending back to the client the state of requested  CRDT-object / objects according to their state on the server;
- sending back states of all stored CRDT-objects, if a specific object was not asked for;

###### **A database layer:**

This layer consists of the two databases - *Main database* and *Temp database*.

- Main database: this database stores states of CRDT-objects;
- Temp database: this database stores user-added operations on CRDT-objects, which are stored in the main database; 

When a user performs *read* operation from cache by some *key*, the following actions are taking place:

1. Firstly, the state of the object ***O*** is going to be found by ***key*** in the *Main database*
2. Then from the *Temporary database*, operations ***o*** performed on the object ***O*** are found.
3. Afterwards, operations ***o*** are applied on the object ***O***.
4. And then object from step *3* is returned back as a response to the application.

 

![Workflow](./img/diagram.svg)



#### The client is offline 

![Workflow](./img/offline.svg)

###### start() function 

````pseudocode
// starting point of the application, which is going to be called on document onload event
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
    
    state = get state of object o by key from the main database
    operations = get operations performed on the object o from the temp database
    
    latest state = apply operations over the state to get latest state of object o
    responseArray.push(latest state);
    
    return reponseArray;
}
```

###### update() function 

````pseudocode
// update function that processes user-made update
// @param key: a key for the object that should be updated;
// @param op: operation performed on the object for the specified key;
// TODO: add the support for multiple changes also!

function update(key, op){
	// as we need to have operations sorted, it should be added to the temp database in the following way:
	// {key, [op1, op2, op3, ... ]} 
	add op to the temp database for the found key;  
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
// @param key: the key of the object, for which the update was requested;

function read(key){
     responseArray = []; // define an empty array, which is going to be sent back
    
     connect(key);
     state = get state of object o by key from the main database
     latest state = object that contains the key and the value
     responseArray.push(latest state);
     return reponseArray;
}
````

###### update() function 

```` fdsf 
// update function that processes user-made update
// @param key: a key for the object that should be updated;
// @param op: operation performed on the object for the specified key
// TODO: add the support for multiple changes also!
function update(key, op){
	// as we need to have operations sorted, it should be added to the temp database in the following way:
	// {key, [op1, op2, op3, ... ]} 
	add op to the temp database for the found key; // store it like this: {key, operation}
    connect();
    return responseStatus;
}
````

###### connect() function

````pseudocode
function connect(key){	
	operations = create an array of objects (from temp database) that consists of key-value pairs, where each value is an operation. // [{key, operation}, ..., ]
	sumbit operations object to the server;
	wait for applying operations on the server's side
	get back from the server updated states of objects 
	state = received state;
	in the main database update the state of object under the key // [{key, state}, ... ]
	clean temporary database; // because these values are already on the server's side
}
````
