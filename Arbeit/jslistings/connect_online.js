function connect(key){	
	operations = create an array of objects (from temp database) that consists of key-value pairs, where each value is an operation. // [{key, operation}, ..., ]
	sumbit operations object to the server;
	wait for applying operations on the server's side
	get back from the server updated states of objects 
	state = received state;
	in the main database update the state of object under the key // [{key, state}, ... ]
	clean temporary database; // because these values are already on the server's side
}