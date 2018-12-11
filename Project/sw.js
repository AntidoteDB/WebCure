/*global DBHelper CounterCRDT SetCRDT MVRegisterCRDT:true*/

var CACHES_NAME = 'webcure-v1';

self.addEventListener('install', function(event) {
  // Mention URLS that need to be cached
  // It is required in order for the application to work offline
  var urlsToCache = [
    // root
    '/',
    '/index.html',
    // js
    '/logger.js',
    '/main.js',
    '/dbhelper.js',
    '/idb.js',
    // js CRDTs
    '/CRDTs/CounterCRDT.js',
    '/CRDTs/SetCRDT.js',
    '/CRDTs/MVRegisterCRDT.js',
    '/CRDTs/MapCRDT.js',
    // css
    '/styles.css',
    // images
    'img/icon-192.png',
    'img/icon-512.png',
    'img/favicon.ico',
    // manifest
    'manifest.json'
  ];

  event.waitUntil(
    caches.open(CACHES_NAME).then(function(cache) {
      // Add all mentioned urls to the cache, so the app could work without the internet
      return cache.addAll(urlsToCache);
    })
  );

  includeScripts();
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request).then(function(response) {
      // Respond the data from the cache, if it was found there. Otherwise, fetch from the network.
      return response || fetch(event.request);
    })
  );
});

self.addEventListener('sync', function(event) {
  if (event.tag === 'syncCounterChanges') {
    event.waitUntil(pushCounterChangesToTheServer());
  } else if (event.tag === 'syncSetChanges') {
    event.waitUntil(pushSetChangesToTheServer());
  } else if (event.tag === 'syncMVRChanges') {
    event.waitUntil(pushMVRChangesToTheServer());
  }
});

function pushCounterChangesToTheServer() {
  DBHelper.getDB();
  DBHelper.crdtDBPromise.then(function(db) {
    var index = db.transaction('crdt-states').objectStore('crdt-states');

    return index
      .getAll()
      .then(function(objects) {
        DBHelper.crdtDBPromise.then(function(db) {
          if (!db) return;
          var index = db.transaction('crdt-timestamps').objectStore('crdt-timestamps');
          return index.get(0).then(function(timestamp) {
            if (objects) {
              objects.forEach(object => {
                if (object.operations && object.operations.length > 0) {
                  fetch(`${DBHelper.SERVER_URL}/api/count_sync/${object.id}`, {
                    method: 'POST',
                    body: JSON.stringify({
                      lastCommitTimestamp: timestamp ? timestamp : undefined,
                      updates: object.operations
                    }),
                    headers: {
                      'Content-Type': 'application/json; charset=utf-8'
                    }
                  });
                }
              });
            }
          });
        });
      })
      .then(function() {
        return DBHelper.crdtDBPromise.then(function(db) {
          if (!db) return;

          var index = db.transaction('crdt-states').objectStore('crdt-states');

          return index.getAll().then(function(objects) {
            var tx = db.transaction('crdt-states', 'readwrite');
            var store = tx.objectStore('crdt-states');

            if (objects) {
              objects.forEach(object => {
                if (object.type === 'counter') {
                  var temp = object;
                  Object.setPrototypeOf(temp, CounterCRDT.prototype);
                  temp.processSentOperations();
                  store.put(temp);
                }
              });
            }
            console.log('Success! Promise all');
            return tx.complete;
          });
        });
      });
  });
}

function pushSetChangesToTheServer() {
  DBHelper.getDB();
  DBHelper.crdtDBPromise.then(function(db) {
    var index = db.transaction('crdt-states').objectStore('crdt-states');

    return index
      .getAll()
      .then(function(objects) {
        DBHelper.crdtDBPromise.then(function(db) {
          if (!db) return;
          var index = db.transaction('crdt-timestamps').objectStore('crdt-timestamps');
          return index.get(0).then(function(timestamp) {
            if (objects) {
              objects.forEach(object => {
                if (object.operations && object.operations.length > 0) {
                  fetch(`${DBHelper.SERVER_URL}/api/set_sync/${object.id}`, {
                    method: 'POST',
                    body: JSON.stringify({
                      lastCommitTimestamp: timestamp ? timestamp : undefined,
                      updates: object.operations
                    }),
                    headers: {
                      'Content-Type': 'application/json; charset=utf-8'
                    }
                  });
                }
              });
            }
          });
        });
      })
      .then(function() {
        return DBHelper.crdtDBPromise.then(function(db) {
          if (!db) return;

          var index = db.transaction('crdt-states').objectStore('crdt-states');

          return index.getAll().then(function(objects) {
            var tx = db.transaction('crdt-states', 'readwrite');
            var store = tx.objectStore('crdt-states');
            if (objects) {
              objects.forEach(object => {
                if (object.type === 'set') {
                  var temp = object;
                  Object.setPrototypeOf(temp, SetCRDT.prototype);
                  temp.processSentOperations();
                  store.put(temp);
                }
              });
            }
            console.log('Success! Promise all');
            return tx.complete;
          });
        });
      });
  });
}

function pushMVRChangesToTheServer() {
  DBHelper.getDB();
  DBHelper.crdtDBPromise.then(function(db) {
    var index = db.transaction('crdt-states').objectStore('crdt-states');

    return index
      .getAll()
      .then(function(objects) {
        DBHelper.crdtDBPromise.then(function(db) {
          if (!db) return;
          var index = db.transaction('crdt-timestamps').objectStore('crdt-timestamps');
          return index.get(0).then(function(timestamp) {
            if (objects) {
              objects.forEach(object => {
                if (object.operations && object.operations.length > 0) {
                  fetch(`${DBHelper.SERVER_URL}/api/mvr_sync/${object.id}`, {
                    method: 'POST',
                    body: JSON.stringify({
                      lastCommitTimestamp: timestamp ? timestamp : undefined,
                      updates: object.operations
                    }),
                    headers: {
                      'Content-Type': 'application/json; charset=utf-8'
                    }
                  });
                }
              });
            }
          });
        });
      })
      .then(function() {
        return DBHelper.crdtDBPromise.then(function(db) {
          if (!db) return;

          var index = db.transaction('crdt-states').objectStore('crdt-states');

          return index.getAll().then(function(objects) {
            var tx = db.transaction('crdt-states', 'readwrite');
            var store = tx.objectStore('crdt-states');

            if (objects) {
              objects.forEach(object => {
                if (object.type === 'mvregister') {
                  var temp = object;
                  Object.setPrototypeOf(temp, MVRegisterCRDT.prototype);
                  temp.processSentOperations();
                  store.put(temp);
                }
              });
            }
            console.log('Success! Promise all');
            return tx.complete;
          });
        });
      });
  });
}

function includeScripts() {
  if (typeof idb === 'undefined') {
    self.importScripts('js/idb.js');
  }

  if (typeof DBHelper === 'undefined') {
    self.importScripts('js/dbhelper.js');
  }

  if (typeof CounterCRDT === 'undefined') {
    self.importScripts('js/CRDTs/CounterCRDT.js');
  }

  if (typeof SetCRDT === 'undefined') {
    self.importScripts('js/CRDTs/SetCRDT.js');
  }

  if (typeof MVRegisterCRDT === 'undefined') {
    self.importScripts('js/CRDTs/MVRegisterCRDT.js');
  }
}

/* function pushMapChangesToTheServer() {
  if (
    typeof idb === 'undefined' ||
    typeof DBHelper === 'undefined' ||
    typeof MapCRDT === 'undefined'
  ) {
    self.importScripts('js/dbhelper.js', 'js/idb.js', 'js/CRDTs/MapCRDT.js');
  }

  let promiseArray = [];

  DBHelper.getDB();
  DBHelper.crdtDBPromise.then(function(db) {
    var index = db.transaction('crdt-states').objectStore('crdt-states');

    return index
      .getAll()
      .then(function(objects) {
        DBHelper.crdtDBPromise
          .then(function(db) {
            if (!db) return;
            var index = db.transaction('crdt-timestamps').objectStore('crdt-timestamps');
            return index.get(0).then(function(timestamp) {
              if (objects) {
                objects.forEach(object => {
                  if (object.operations && object.operations.length > 0) {
                    fetch(`${DBHelper.SERVER_URL}/api/mvr_sync/${object.id}`, {
                      method: 'PUT',
                      body: JSON.stringify({
                        lastCommitTimestamp: timestamp ? timestamp : undefined,
                        updates: object.operations
                      }),
                      headers: {
                        'Content-Type': 'application/json; charset=utf-8'
                      }
                    }).then(response => response.json());
                  }
                });
              }
            });
          })
          .catch(function() {
            // TODO throw an error
          });
      })
      .then(function() {
        return Promise.all(promiseArray)
          .then(function() {
            DBHelper.crdtDBPromise.then(function(db) {
              if (!db) return;

              var index = db.transaction('crdt-states').objectStore('crdt-states');

              return index.getAll().then(function(objects) {
                var tx = db.transaction('crdt-states', 'readwrite');
                var store = tx.objectStore('crdt-states');

                if (objects) {
                  objects.forEach(object => {
                    var temp = object;
                    Object.setPrototypeOf(temp, MVRegisterCRDT.prototype);
                    temp.processSentOperations();
                    store.put(temp);
                  });
                }
                console.log('Success! Promise all');
                return tx.complete;
              });
            });
          })
          .catch(function(error) {
            throw 'Silenced Exception! ' + error;
          });
      });
  });
} */
