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
    "/favicon.ico",
    // css
    "/css/appointment.css",
    "/css/appStyle.css",
    "/css/bootstrap-tour-standalone.min.css",
    "/css/bootstrap.min.css",
    "/css/calendarLayout.css",
    "/css/fullcalendar.css",
    // js
    "/js/idb.js",
    "/js/dbhelper.js",
    "/js/appoinmentPopup.js",
    "/js/bootstrap-tour-standalone.min.js",
    "/js/bootstrap.min.js",
    "/js/client.js",
    "/js/fullcalendar.js",
    "/js/jquery.js",
    "/js/moment.min.js",
    "/js/organizer.js",
    "/js/popper.min.js",
    // CRDTs
    "/js/CRDTs/CounterCRDT.js",
    "/js/CRDTs/MapCRDT.js",
    "/js/CRDTs/MVRegisterCRDT.js",
    "/js/CRDTs/SetCRDT.js"
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

self.addEventListener("sync", function(event) {
  if (event.tag === "syncUserChanges") {
    event.waitUntil(pushUserChangesToTheServer());
  }
});

function pushUserChangesToTheServer() {
  includeScripts();

  DBHelper.getDB();

  var syncUserChanges = function(calendarId) {
    DBHelper.crdtDBPromise.then(function(db) {
      var index = db
        .transaction(`participants-${calendarId}`)
        .objectStore(`participants-${calendarId}`);

      return index
        .getAll()
        .then(function(objects) {
          DBHelper.crdtDBPromise.then(function(db) {
            if (!db) return;
            var index = db
              .transaction(`participants-${calendarId}`)
              .objectStore(`participants-${calendarId}`);
            return index.get(0).then(function(timestamp) {
              if (objects) {
                objects.forEach(object => {
                  if (object.operations && object.operations.length > 0) {
                    fetch(`${DBHelper.SERVER_URL}/api/${calendarId}/sync`, {
                      method: "POST",
                      body: JSON.stringify({
                        lastCommitTimestamp: timestamp ? timestamp : undefined,
                        updates: object.operations
                      }),
                      headers: {
                        "Content-Type": "application/json; charset=utf-8"
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

            var index = db
              .transaction(`participants-${calendarId}`)
              .objectStore(`participants-${calendarId}`);

            return index.getAll().then(function(objects) {
              var tx = db.transaction(
                `participants-${calendarId}`,
                "readwrite"
              );
              var store = tx.objectStore(`participants-${calendarId}`);

              if (objects) {
                objects.forEach(object => {
                  if (object.type === "set") {
                    var temp = object;
                    Object.setPrototypeOf(temp, SetCRDT.prototype);
                    temp.processSentOperations();
                    store.put(temp);
                  }
                });
              }
              console.log("Success! Promise all");
              return tx.complete;
            });
          });
        });
    });
  };

  syncUserChanges(1);
  syncUserChanges(2);
}

function includeScripts() {
  if (typeof idb === "undefined") {
    self.importScripts("js/idb.js");
  }

  if (typeof DBHelper === "undefined") {
    self.importScripts("js/dbhelper.js");
  }

  if (typeof CounterCRDT === "undefined") {
    self.importScripts("js/CRDTs/CounterCRDT.js");
  }

  if (typeof SetCRDT === "undefined") {
    self.importScripts("js/CRDTs/SetCRDT.js");
  }

  if (typeof MVRegisterCRDT === "undefined") {
    self.importScripts("js/CRDTs/MVRegisterCRDT.js");
  }
}
