/**
 * Register Service Worker and manipulate the content on load
 */

/**
 * Initialize the database, Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', event => {
  DBHelper.getDB();
});

/*global DBHelper Logger log :true*/

window.addEventListener('load', () => {
  registerServiceWorker();
  Logger.show();
  Logger.open();
  addCounterForm();
});

/*
 * Subscribe for the sync event
 */

const requestSync = () => {
  navigator.serviceWorker.ready
    .then(function(swRegistration) {
      return swRegistration.sync.register('syncChanges');
    })
    .catch(function(error) {
      console.log(error);
    });
};

const addCounterForm = () => {
  const mainContainer = document.getElementById('maincontent');
  const form = document.createElement('form');
  const li = document.createElement('ul');

  const liName = document.createElement('li');

  const name = document.createElement('input');
  name.type = 'text';
  name.name = 'name';
  name.id = 'name-field';
  name.placeholder = 'Enter the variable name';

  const labelName = document.createElement('label');
  labelName.setAttribute('for', name.id);
  labelName.innerHTML = 'Name: ';

  liName.appendChild(labelName);
  liName.appendChild(document.createElement('br'));
  liName.appendChild(name);

  /**
   * Creating the 'get' button:
   */

  const liGetBtn = document.createElement('li');

  const getBtn = document.createElement('button');
  getBtn.id = 'getbtn-field';
  getBtn.innerHTML = 'Get Counter!';
  getBtn.type = 'button';

  const labelGetBtn = document.createElement('label');
  labelGetBtn.setAttribute('for', getBtn.id);
  labelGetBtn.innerHTML = 'Get Button: ';

  liGetBtn.appendChild(labelGetBtn);
  liGetBtn.appendChild(document.createElement('br'));
  liGetBtn.appendChild(getBtn);

  getBtn.onclick = function() {
    log(`Getting ${name.value}`);
    fetch(`${DBHelper.SERVER_URL}/api/1/count/${name.value}`, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      }
    })
      .then(function(response) {
        return response.json();
      })
      .then(function(json) {
        DBHelper.crdtDBPromise
          .then(function(db) {
            if (!db) return;

            var tx = db.transaction('crdt-states', 'readwrite');
            var store = tx.objectStore('crdt-states');

            var item = {
              id: name.value,
              value: json.cont
            };

            store.put(item);

            return tx.complete;
          })
          .then(function() {
            DBHelper.crdtDBPromise
              .then(function(db) {
                if (!db) return;

                var tx = db.transaction('crdt-operations', 'readwrite');
                var store = tx.objectStore('crdt-operations');

                return store.openCursor();
              })
              .then(function cleanOperationsDB(cursor) {
                if (!cursor) return;
                cursor.delete(cursor.value);
                return cursor.continue().then(cleanOperationsDB);
              });
          });
        log(`The value of ${name.value} is: ${json.cont}`);
      })
      .catch(function() {
        var statesCached = [];
        DBHelper.crdtDBPromise
          .then(function(db) {
            if (!db) return;

            var index = db.transaction('crdt-states').objectStore('crdt-states');

            return index.getAll().then(function(states) {
              statesCached = states;
              var index = db.transaction('crdt-operations').objectStore('crdt-operations');

              return index.get(name.value).then(function(value) {
                var counter = 0;
                statesCached.forEach(state => {
                  if (state.id === name.value) {
                    if (value) {
                      var operations = value.operations;

                      operations.forEach(operation => {
                        counter = counter + operation;
                      });
                    }

                    counter += state.value;

                    log(`[Offline] The value of ${name.value} is: ${counter}`);
                  }
                });
              });
            });
          })
          .catch(function() {
            // TODO throw an error
          });
      });
  };

  /**
   * Creating the 'inc' button:
   */

  const liIncBtn = document.createElement('li');

  const incBtn = document.createElement('button');
  incBtn.id = 'incbtn-field';
  incBtn.innerHTML = 'Inc Counter!';
  incBtn.type = 'button';

  const labelIncBtn = document.createElement('label');
  labelIncBtn.setAttribute('for', incBtn.id);
  labelIncBtn.innerHTML = 'Inc Button: ';

  liIncBtn.appendChild(labelIncBtn);
  liIncBtn.appendChild(document.createElement('br'));
  liIncBtn.appendChild(incBtn);

  incBtn.onclick = function() {
    requestSync();
    log(`Incrementing the value of ${name.value}`);
    fetch(`${DBHelper.SERVER_URL}/api/1/count/${name.value}`, {
      method: 'PUT',
      data: `value=${1}`,
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      }
    })
      .then(function(response) {
        return response.json();
      })
      .then(function() {
        //log(`The response for id ${name.value} is: ${json.status}`);
      })
      .catch(function(error) {
        DBHelper.crdtDBPromise
          .then(function(db) {
            if (!db) return;

            var index = db.transaction('crdt-operations').objectStore('crdt-operations');

            return index.get(name.value).then(function(val) {
              var tx = db.transaction('crdt-operations', 'readwrite');
              var store = tx.objectStore('crdt-operations');
              if (!val) {
                store.put({
                  id: name.value,
                  operations: [1]
                });
              } else {
                var temp = val;

                if (!temp.operations) {
                  temp.operations = [];
                }

                temp.operations.push(1);

                store.put(temp);
              }

              return tx.complete;
            });
          })
          .catch(function() {
            // TODO throw an error
          });

        //log(`Failed to increment the id ${name.value}: ${error}`);
      });
  };

  /**
   * Creating the 'dec' button:
   */

  const liDecBtn = document.createElement('li');

  const decBtn = document.createElement('button');
  decBtn.id = 'decbtn-field';
  decBtn.innerHTML = 'Dec Counter!';
  decBtn.type = 'button';

  const labelDecBtn = document.createElement('label');
  labelDecBtn.setAttribute('for', decBtn.id);
  labelDecBtn.innerHTML = 'Dec Button: ';

  liDecBtn.appendChild(labelDecBtn);
  liDecBtn.appendChild(document.createElement('br'));
  liDecBtn.appendChild(decBtn);

  decBtn.onclick = function() {
    requestSync();
    log(`Decrementing the value of ${name.value}`);
    fetch(`${DBHelper.SERVER_URL}/api/1/count/${name.value}`, {
      method: 'DELETE',
      data: `value=${1}`,
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      }
    })
      .then(function(response) {
        return response.json();
      })
      .then(function() {
        //log(`The response for id ${name.value} is: ${json.status}`);
      })
      .catch(function(error) {
        DBHelper.crdtDBPromise
          .then(function(db) {
            if (!db) return;

            var index = db.transaction('crdt-operations').objectStore('crdt-operations');

            return index.get(name.value).then(function(val) {
              var tx = db.transaction('crdt-operations', 'readwrite');
              var store = tx.objectStore('crdt-operations');
              if (!val) {
                store.put({
                  id: name.value,
                  operations: [-1]
                });
              } else {
                var temp = val;

                if (!temp.operations) {
                  temp.operations = [];
                }

                temp.operations.push(-1);

                store.put(temp);
              }

              return tx.complete;
            });
          })
          .catch(function() {
            // TODO throw an error
          });

        //log(`Failed to increment the id ${name.value}: ${error}`);
      });
  };

  // Add everything to the form
  li.appendChild(liName);
  li.appendChild(liGetBtn);
  li.appendChild(liIncBtn);
  li.appendChild(liDecBtn);
  form.appendChild(li);
  mainContainer.appendChild(form);

  //DBHelper.fetchRestaurants();
};

/**
 * Register a service worker
 */

const registerServiceWorker = () => {
  if (!navigator.serviceWorker) return;

  navigator.serviceWorker
    .register('/sw.js')
    .then(function() {
      console.log('Service Worker registered!');
    })
    .catch(function() {
      console.log('Registration of the Service Worker failed');
    });
};
