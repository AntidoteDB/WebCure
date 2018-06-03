import idb from 'idb'; // import of the framework to maintain IndexDB databases


// Define databases globally
var mainDatabase; // = ... specify the details
var tempDatabase; // = ... specify the details


$(document).ready(function() { 
    init(); 
});


/**
 *  A function, which is called to pull updates from the server
 * 
 * @param {any} timestamp: a timestamp, which indicates that server sents back updates that are fresher than timestamp
 *              if undefined, then server sends all available data;
 * @param {any} callback: a function, which is going to be called after the updates were received. 
 */
// TODO: discuss, whether to store only the latest timestamp on the clien't side (alongside an object, where all previous operations are applied already)
// TODO: or to have timestamps for all the objects
function pullUpdates(timestamp, callback) {
    if (response.status === 200 && response.data !== null){
        callback(response.data);
    }
    else {
        console.log(ERROR_MESSAGE);
    }
}


/**
 *  A function, which is called in order to push updates to the server
 * 
 * @param {any} data: operations that have to be sent to the server; 
 * @param {any} callbackSuccessful: function to call in case of success 
 * @param {any} callbackFailure: function to call in case of failure 
 */
function pushUpdates(data, callbackSuccessful, callbackFailure) {
    // We want to push to the server only these updates that are either located  
    // Send POST-request to the SERVER

    if (response.status === 200 && response.data !== null){
        callbackSuccessful(response);
    }
    else {
        callbackFailure(response);
    }
}


/**
 * A function, which is running operations to maintain the data of the application
 * 
 */
function init(){    
    // Before going to the network, show in UI the data from the database
    displayDataFromDB();

    // get the latest timestamp from main database
    var timestamp = getLatestTimestamp();
    
    // Pull updates from the server starting from the passed timestamp
    pullUpdates(timestamp, function callback(data){
        // once updates recieved, show them in UI
        showReceivedData(data);
        // store recived updates in the DB
        storeNewDataTotheDB(data);
        // if temp database is not empty, send it's operations to the server
        sendDataFromTempDB(); // TODO: discuss the behaviour of the situation, when changes were made to both server and client. 
                              // TODO: - What and how to display in the UI?  
    });
}


/**
 * return the latest timestamp from the main database 
 * 
 */
function getLatestTimestamp(){
    // TODO 
}


/**
 * This function is displaying data from the database in UI
 * 
 * @returns 
 */
function displayDataFromDB(){
    var index = db.transaction('counters').objectStore('counters');
    return index.getAll().then(function(data){
        addDatatoUI();
    });
}


/**
 * This function is displaying in UI the data, which was just received from the server
 * 
 * @param data: data that was just received from the server
 */
function showReceivedData(data){

}


/**
 * This function stores newly received data from the network to the main database
 * 
 * @param {any} data: newly received data
 */
function storeNewDataTotheDB(data){

    var messages = JSON.parse(data);

    var tx = db.transaction('counters', 'readwrite');
    var store = tx.objectStore('counters');

    messages = processCRDTDATA(messages);

    messages.forEach(function(message){
        store.put(message);
    });
}


/**
 * This function creates the main Database 
 * 
 * @returns the database object
 */
function openMainDatabase(){
    if (!navigator.serviceWorker){
        return;
    }

    return idb.open('mainDatabase', 1, function(upgradeDB){
        var store = upgradeDb.createObjectStore('counters', {
            keyPath: 'timestamp' // will treat timestamps as primary key
        });
    });
}


/**
 * This function cretes the temporary database
 * 
 * @returns the database object
 */
function openTempDatabase(){
    // similar code
}


/**
 * This function handles storing the data to the main DB after the server marked it with a timestamp
 * 
 * @param {any} data: - originally added data
 * @param {any} response: - a response from the server, which consists of timestamp for the data
 */
function storeDataToDB(data, response){
    
}

/**
 * This function handles cleaning the temporary database, after updates were pushed to the server.
 * 
 * @param {any} data: optional (depends whether to remove all of the data or just part of it)
 */
function emptyTempDB(data){

}


/**
 * This function handles user-inserted data 
 * 
 * @param {any} data This parameter is for data added through the UI
 */
function getDataFromUI(data){
    pushUpdates(data, function(res){
        // sucess callback
        storeDataToDB(data, response);
        emptyTempDB(data);
    }, function(response){
        // failure callback
        storeDataToTempDB(data);
    });
}