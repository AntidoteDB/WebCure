/*global DBHelper CounterCRDT:true*/

var CACHES_NAME = 'web-antidotedb-v1';

self.addEventListener('install', function(event) {
  // Mention URLS that need to be cached
  // It is required in order for the application to work offline
  var urlsToCache = [
    // root
    '/',
    '/index.html',
    // js
    '/client.js',
    '/index.js',
    '/logger.js',
    '/main.js',
    '/dbhelper.js',
    '/idb.js',
    // js CRDTs
    '/CRDTs/CounterCRDT.js',
    '/CRDTs/SetCRDT.js',
    // css
    '/styles.css'
  ];

  event.waitUntil(
    caches.open(CACHES_NAME).then(function(cache) {
      // Add all mentioned urls to the cache, so the app could work without the internet
      return cache.addAll(urlsToCache);
    })
  );
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
  if (event.tag === 'syncChanges') {
    event.waitUntil(pushChangesToTheServer());
  }
});

function pushChangesToTheServer() {
  if (
    typeof idb === 'undefined' ||
    typeof DBHelper === 'undefined' ||
    typeof CounterCRDT === 'undefined'
  ) {
    self.importScripts('js/dbhelper.js', 'js/idb.js', 'js/CRDTs/CounterCRDT.js');
  }

  let promiseArray = [];

  DBHelper.getDB();
  DBHelper.crdtDBPromise.then(function(db) {
    var index = db.transaction('crdt-states').objectStore('crdt-states');

    return index
      .getAll()
      .then(function(objects) {
        if (objects) {
          objects.forEach(object => {
            if (object.operations) {
              object.operations.forEach(operation => {
                promiseArray.push(
                  fetch(`${DBHelper.SERVER_URL}/api/count/${object.id}`, {
                    method: operation > 0 ? 'PUT' : 'DELETE',
                    data: `value=${operation}`,
                    headers: {
                      'Content-Type': 'application/json; charset=utf-8'
                    }
                  }).then(response => response.json())
                );
              });
            }
          });
        }
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
                    Object.setPrototypeOf(temp, CounterCRDT.prototype);
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
}
