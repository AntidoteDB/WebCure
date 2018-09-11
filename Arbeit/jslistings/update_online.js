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