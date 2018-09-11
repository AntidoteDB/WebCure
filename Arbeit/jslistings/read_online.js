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