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