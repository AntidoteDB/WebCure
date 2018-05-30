import idb from 'idb';

// This function is called, when the document is loaded
$(document).ready(function() { 
    // Start processing the data
    openMainDatabase();
    handleTheData(); 
});


function pullUpdates(timestamp, callback) {
    // We need to specify, which updates we want to get
    // If the @timestamp parameter is null, then we want to get all of the updates. 
    // Otherwise, we want to received all of the updates that are fresher than @timestamp


    // Send GET-request to the SERVER

    if (response.status === 200 && response.data !== null){
        callback();
    }
    else {
        console.log(ERROR_MESSAGE);
    }
}

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

function handleTheData(){
    
    // Before going to the network, show the data from the database in UI
    showTheDataFromtheDB();

    pullUpdates(function callback(){
        showTheDataFromtheNetwork();
        storeNewDataTotheDB();
        sendDataFromTempDB();
    });
}

function showTheDataFromtheDB(){
    var index = db.transaction('counters').objectStore('counters');
    return index.getAll().then(function(data){
        addDatatoUI();
    });
}

function showTheDataFromtheNetwork(){

}

function storeNewDataTotheDB(data){

    var messages = JSON.parse(data);

    var tx = db.transaction('counters', 'readwrite');
    var store = tx.objectStore('counters');

    messages = processCRDTDATA(messages);

    messages.forEach(function(message){
        store.put(message);
    });
}

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

function openTempDatabase(){
    // similar code
}

function storeDataToDB(data, response){
    // function that handles storing the data to DB after server marked it with a timestamp
}

function getDataFromUI(data){
    pushUpdates(data, function(res){
        // sucess callback
        storeDataToDB(data, response);
    }, function(response){
        // failure callback
        storeDataToTempDB(data);
    });
}