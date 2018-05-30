import idb from 'idb';

// This function is called, when the document is loaded
$(document).ready(function() { 
    // Start processing the data
    openMainDatabase();
    handleTheData(); 
});


function pullUpdates(callback) {
    // Send GET-request to the SERVER

    if (response.status === 200 && response.data !== null){
        callback();
    }
    else {
        console.log(ERROR_MESSAGE);
    }
}

function pushUpdates() {
    // Send POST-request to the SERVER

    if (response.status === 200 && response.data !== null){
        console.log(SUCCESS_MESSAGE);
    }
    else {
        console.log(ERROR_MESSAGE);
    }
}

function handleTheData(){
    
    // Before going to the network, show the data from the database in UI
    showTheDataFromtheDB();

    pullUpdates(function callback(){
        showTheDataFromtheNetwork();
        storeNewDataTotheDB();
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