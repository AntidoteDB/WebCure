/*global DBHelper:true*/

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
    '/crdt_counter.js',
    '/crdt_set_aw.js',
    '/index.js',
    '/logger.js',
    '/main.js',
    '/vectorclock.js',
    '/dbhelper.js',
    '/idb.js',
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
  if (typeof idb === 'undefined' || typeof DBHelper === 'undefined') {
    self.importScripts('js/dbhelper.js', 'js/idb.js');
  }

  let promiseArray = [];

  DBHelper.getDB();
  DBHelper.crdtDBPromise.then(function(db) {
    var index = db.transaction('crdt-operations').objectStore('crdt-operations');

    return index
      .getAll()
      .then(function(objects) {
        if (objects) {
          objects.forEach(object => {
            if (object.operations) {
              object.operations.forEach(operation => {
                promiseArray.push(
                  fetch(`${DBHelper.SERVER_URL}/api/1/count/${object.id}`, {
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

              var index = db.transaction('crdt-operations').objectStore('crdt-operations');

              return index.getAll().then(function(objects) {
                var tx = db.transaction('crdt-operations', 'readwrite');
                var store = tx.objectStore('crdt-operations');

                if (objects) {
                  objects.forEach(object => {
                    var temp = object;

                    if (!temp.sentOperations) {
                      temp.sentOperations = [];
                    }

                    if (temp.operations) {
                      temp.operations.forEach(operation => {
                        temp.sentOperations.push(operation);
                      });
                      temp.operations = [];
                    }

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
