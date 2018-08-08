/**
 * Common database helper functions.
 */
/*global idb :true*/

class DBHelper {
  /**
   * Server URL.
   */
  static get SERVER_URL() {
    const port = 3000; // Change this to your server port
    return `http://localhost:${port}`;
  }

  /**
   *  Store the promise of the database
   *
   */
  static getDB() {
    this.crdtDBPromise = idb.open('crdt-db', 1, function(upgradeDB) {
      switch (upgradeDB.oldVersion) {
        case 0:
          var stateStore = upgradeDB.createObjectStore('crdt-states', {
            keyPath: 'id'
          });
          stateStore.createIndex('id', 'id');

          var operationStore = upgradeDB.createObjectStore('crdt-operations', {
            keyPath: 'id'
          });
          operationStore.createIndex('id', 'id');
      }
    });
  }

  /**
   * Process the response of the fetch request
   */
  static status(response) {
    if (response.status >= 200 && response.status < 300) {
      return Promise.resolve(response);
    } else {
      return Promise.reject(new Error(`Request failed. Returned status of ${response.statusText}`));
    }
  }

  /**
   * Parse the received JSON data
   */
  static json(response) {
    return response.json();
  }

  /**
   * Fetch all restaurants.
   */
  /*   static fetchRestaurants(callback) {
    fetch(DBHelper.DATABASE_URL)
      .then(DBHelper.status)
      .then(DBHelper.json)
      .then(function(restaurants) {
        DBHelper.restaurantDBPromise.then(function(db) {
          if (!db) return;

          var tx = db.transaction('restaurants', 'readwrite');
          var store = tx.objectStore('restaurants');
          restaurants.forEach(function(restaurant) {
            store.put(restaurant);
          });
        });
        callback(null, restaurants);
      })
      .catch(function(error) {
        // When fetch fails, try to get the data from the database
        DBHelper.restaurantDBPromise
          .then(function(db) {
            if (!db) return;

            var index = db.transaction('restaurants').objectStore('restaurants');

            return index.getAll().then(function(restaurants) {
              callback(null, restaurants);
            });
          })
          .catch(function() {
            callback(error, null);
          });
      });
  } */
}
