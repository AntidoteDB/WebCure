import idb from 'idb';

var mainDBPromise = idb.open('main-db', 4, function(upgradeDB){
    switch(upgradeDB.oldVersion){
        case 0:
            var keyValStore = upgradeDB.createObjectStore('keyval');
            keyValStore.put('world', 'hello');
        case 1:
            upgradeDB.createObjectStore('people', {keyPath: 'name'});
        case 2: 
            var peopleStore = upgradeDB.transaction.objectStore('people');
            peopleStore.createIndex('animal', 'favoriteAnimal');
        case 3: 
            peopleStore = upgradeDB.transaction.objectStore('people');
            peopleStore.createIndex('age', 'age'); 
    }
});

var tempDBPromise = idb.open('temp-db', 1, function (upgradeDB){

});

mainDBPromise.then(function(db){
    var tx = db.transaction('keyval');
    var keyValStore = tx.objectStore('keyval');
    return keyValStore.get('hello');
}).then(function(data){
    console.log("Value: " + data);
});

mainDBPromise.then(function(db){
    var tx = db.transaction('keyval', 'readwrite');
    var keyValStore = tx.objectStore('keyval');
    keyValStore.put('bar', 'foo');
    return tx.complete;
}).then(function(){
    console.log('Added to the db');
});

mainDBPromise.then(function(db){
    var tx = db.transaction('keyval', 'readwrite');
    var keyValStore = tx.objectStore('keyval');
    keyValStore.put('cat', 'favouriteAnimal');
    return tx.complete;
}).then(function(val){
    console.log('Added fav animal to keyval', val);
});

// write people
mainDBPromise.then(function(db){
    var tx = db.transaction('people', 'readwrite');
    var peopleStore = tx.objectStore('people');

    peopleStore.put({
        name: 'Sam Munoz',
        age: 25,
        favoriteAnimal: 'dog'
    });

    return tx.complete;
}).then(function(){
    console.log('success!');
});

// read people

mainDBPromise.then(function(db){
    var tx = db.transaction('people');
    var peopleStore = tx.objectStore('people');

    return peopleStore.getAll();
}).then(function(people){
    console.log('People: ', people);
});

// read all people ordered by age;

mainDBPromise.then(function(db){
    var tx = db.transaction('people');
    var peopleStore = tx.objectStore('people');
    var ageIndex = peopleStore.index('age');

    return ageIndex.getAll();
}).then(function(people){
    console.log('People by age: ', people);
});

// read all people ordered by age using CURSOR

mainDBPromise.then(function(db){
    var tx = db.transaction('people');
    var peopleStore = tx.objectStore('people');
    var ageIndex = peopleStore.index('age');

    return ageIndex.cursor();
}).then(function(cursor){
    if (!cursor) return;
    return cursor.advance(2); // skip first 2 items
}).then(function logPerson(cursor){
    if (!cursor) return; 

    console.log('Cursored at: ', cursor.value.name);
    // cursor.update(newValue) -- to change the value
    // cursor.delete() -- to remove the value
    return cursor.continue().then(logPerson);
}).then(function(){
    console.log('Done cursoring!');
});