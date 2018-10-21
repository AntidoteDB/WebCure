/*global DBHelper CounterCRDT SetCRDT MVRegisterCRDT MapCRDT:true*/

var CACHES_NAME = "calendar_offline-v1";

self.addEventListener("install", function(event) {
  // Mention URLS that need to be cached
  // It is required in order for the application to work offline
  var urlsToCache = [
    // root
    "/",
    // views
    "/views/index.html",
    "/views/404.html",
    // favicon
    "/public/favicon.ico",
    // css
    "/public/css/appointment.css",
    "/public/css/appStyle.css",
    "/public/css/bootstrap-tour-standalone.min.css",
    "/public/css/bootstrap.min.css",
    "/public/css/calendarLayout.css",
    "/public/css/fullcalendar.css",
    // js
    "/public/js/appoinmentPopup.js",
    "/public/js/bootstrap-tour-standalone.min.js",
    "/public/js/bootstrap.min.js",
    "/public/js/client.js",
    "/public/js/fullcalendar.js",
    "/public/js/jquery.js",
    "/public/js/moment.min.js",
    "/public/js/organizer.js",
    "/public/js/popper.min.js",
    // CRDTs
    "/public/js/CRDTs/CounterCRDT.js",
    "/public/js/CRDTs/MapCRDT.js",
    "/public/js/CRDTs/MVRegisterCRDT.js",
    "/public/js/CRDTs/SetCRDT.js",

  ];

  event.waitUntil(
    caches.open(CACHES_NAME).then(function(cache) {
      // Add all mentioned urls to the cache, so the app could work without the internet
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener("fetch", function(event) {
  event.respondWith(
    caches.match(event.request).then(function(response) {
      // Respond the data from the cache, if it was found there. Otherwise, fetch from the network.
      return response || fetch(event.request);
    })
  );
});

/* self.addEventListener('sync', function(event) {
  if (event.tag === 'syncCounterChanges') {
    event.waitUntil(pushCounterChangesToTheServer());
  } else if (event.tag === 'syncSetChanges') {
    event.waitUntil(pushSetChangesToTheServer());
  } else if (event.tag === 'syncMVRChanges') {
    event.waitUntil(pushMVRChangesToTheServer());
  } else if (event.tag === 'syncMapChanges') {
    event.waitUntil(pushMapChangesToTheServer());
  }
});

function pushCounterChangesToTheServer() {
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
        DBHelper.crdtDBPromise
          .then(function(db) {
            if (!db) return;
            var index = db.transaction('crdt-timestamps').objectStore('crdt-timestamps');
            return index.get(0).then(function(timestamp) {
              if (objects) {
                objects.forEach(object => {
                  if (object.operations && object.operations.length > 0) {
                    fetch(`${DBHelper.SERVER_URL}/api/count_sync/${object.id}`, {
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
                    // TODO FIX THE BUG WITH CLEANING NOT CORRECT DATA!!!!!
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

function pushSetChangesToTheServer() {
  if (
    typeof idb === 'undefined' ||
    typeof DBHelper === 'undefined' ||
    typeof SetCRDT === 'undefined'
  ) {
    self.importScripts('js/dbhelper.js', 'js/idb.js', 'js/CRDTs/SetCRDT.js');
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
                    fetch(`${DBHelper.SERVER_URL}/api/set_sync/${object.id}`, {
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
                    Object.setPrototypeOf(temp, SetCRDT.prototype);
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

function pushMVRChangesToTheServer() {
  if (
    typeof idb === 'undefined' ||
    typeof DBHelper === 'undefined' ||
    typeof MVRegisterCRDT === 'undefined'
  ) {
    self.importScripts('js/dbhelper.js', 'js/idb.js', 'js/CRDTs/MVRegisterCRDT.js');
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
}

function pushMapChangesToTheServer() {
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
}
 */
