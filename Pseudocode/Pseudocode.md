# Pseudocode 



![Workflow](.\Untitled Diagram.svg)



#### The client is offline 

###### read() function 

```pseudocode
// Read function that pulls database changes
// @param key: the key of the object, for which the update was requested; if undefined, then all changes will be pulled

function read(key) {
    responseArray = []; // define an empty array, which is going to be sent back
    if (main database is not empty) {
        if (key is not undefined) {
            state = get state of object by key from the main database
            operations = get operations performed on the object o from the temp database
            apply operations over the state
            response = object that contains the key and the value
            responseArray.push(response);
        } else {
            for (every key in the main database) {
                state = get state of object by key
                for (every key in the temp database) {
                    operations = get operations performed on the object o;
                    apply operations over the state
                    response = object that contains the key and the value
                    responseArray.push(response);
                }
            }
        }
    }

    return reponseArray;
}
```

###### update() function 

````pseudocode
// update function that processes user-made update
// @param key
// @param op: 
function write(key, op){
    if (key is found in the main database){
        add op to the temp database for the found key;
    }
    else {
        newop = create a key;
        add newop to the temp database;
        add op to the temp database for the key;
        // or maybe we can just notify the user that there is no such key in the main database
    }
}
````

#### The client is online

###### read() function

````pseudocode
// Read function that pulls database changes
// @param key: the key of the object, for which the update was requested; if undefined, then all changes will be pulled

function read(key){
     responseArray = []; // define an empty array, which is going to be sent back
     if (temp database is not empty){
         send operations from temp database to the server
         update the main database 
     }
     
     state = get the state of key from the main database;
     response = object that contains the key and the value
     responseArray.push(response);
}
````

###### update() function 

```` fdsf 
// update function that processes user-made update
// @param key
// @param op: 
function write(key, op){
    if (key is found in the main database){
        add op to the temp database for the found key;
    }
    else {
        newop = create a key;
        add newop to the temp database;
        add op to the temp database for the key;
    }
    
    send created operations to the server
    when the response is received:
    	update the main database
    	clean the temp database
}
````

