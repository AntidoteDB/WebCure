/**
 * Register Service Worker and manipulate the content on load
 */

/**
 * Initialize the database, Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', event => {
  DBHelper.getDB();
});

/*global DBHelper Logger log CounterCRDT SetCRDT MVRegisterCRDT MapCRDT:true*/

window.addEventListener('load', () => {
  registerServiceWorker();
  Logger.show();
  Logger.open();
  addCounterForm();
  addSetForm();
  addMVRegisterForm();
  //addMapForm();
});

/*
 * Subscribe for the sync event
 */

const requestCounterSync = () => {
  navigator.serviceWorker.ready
    .then(function(swRegistration) {
      return swRegistration.sync.register('syncCounterChanges');
    })
    .catch(function(error) {
      console.log(error);
    });
};

/*
 * Subscribe for the sync event
 */

const requestSetSync = () => {
  navigator.serviceWorker.ready
    .then(function(swRegistration) {
      return swRegistration.sync.register('syncSetChanges');
    })
    .catch(function(error) {
      console.log(error);
    });
};

/*
 * Subscribe for the sync event
 */

const requestMVRSync = () => {
  navigator.serviceWorker.ready
    .then(function(swRegistration) {
      return swRegistration.sync.register('syncMVRChanges');
    })
    .catch(function(error) {
      console.log(error);
    });
};

/*
 * Subscribe for the sync event
 */

const requestMapSync = () => {
  navigator.serviceWorker.ready
    .then(function(swRegistration) {
      return swRegistration.sync.register('syncMapsChanges');
    })
    .catch(function(error) {
      console.log(error);
    });
};

/*
 * Fill in the select elements
 */

const fillSelectsEls = elementDoms => {
  elementDoms.forEach(elementDom => {
    elementDom.innerHTML = '';
    DBHelper.crdtDBPromise.then(function(db) {
      if (!db) return;

      var index = db.transaction('crdt-states').objectStore('crdt-states');

      return index.getAll().then(function(states) {
        var selectOptions = [],
          i = 'a'.charCodeAt(0),
          j = 'z'.charCodeAt(0);

        for (; i <= j; ++i) {
          selectOptions.push(String.fromCharCode(i));
        }

        states.forEach(state => {
          if (elementDom.id.indexOf(state.type) === -1) {
            selectOptions = selectOptions.filter(item => item !== state.id);
          }
        });

        selectOptions.forEach(element => {
          const option = document.createElement('option');
          option.value = element;
          option.innerHTML = element;
          elementDom.appendChild(option);
        });
      });
    });
  });
};

/**
 * Add the form for interacting with a counter CRDT
 *
 */
const addCounterForm = () => {
  const mainContainer = document.getElementById('counter-options');
  const form = document.createElement('form');
  const li = document.createElement('ul');

  const liName = document.createElement('li');
  const liNameLabel = document.createElement('li');

  const name = document.createElement('select');
  name.name = 'name';
  name.id = 'counter-name-field';
  name.placeholder = 'Enter the variable name';

  fillSelectsEls([name]);

  const labelName = document.createElement('label');
  labelName.innerHTML = 'Counter Id';
  labelName.setAttribute('for', name.id);

  liNameLabel.appendChild(labelName);

  liName.appendChild(document.createElement('br'));
  liName.appendChild(name);

  const liTimestamp = document.createElement('li');
  const liTimestampName = document.createElement('li');

  const timestamp = document.createElement('input');
  timestamp.type = 'text';
  timestamp.name = 'timestamp';
  timestamp.id = 'count-timestamp-field';
  timestamp.placeholder = 'Enter the timestamp to read (optional)';

  const labelTimestamp = document.createElement('label');
  labelTimestamp.setAttribute('for', timestamp.id);
  labelTimestamp.innerHTML = 'Timestamp';

  liTimestampName.appendChild(labelTimestamp);
  liTimestamp.appendChild(document.createElement('br'));
  liTimestamp.appendChild(timestamp);

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

  liGetBtn.appendChild(labelGetBtn);
  liGetBtn.appendChild(document.createElement('br'));
  liGetBtn.appendChild(getBtn);

  getBtn.onclick = function() {
    const byTimestamp = timestamp.value !== '';
    log(`Getting ${name.value}`);
    DBHelper.crdtDBPromise.then(function(db) {
      if (!db) return;
      var index = db.transaction('crdt-timestamps').objectStore('crdt-timestamps');
      return index.get(0).then(function(storedTimestamp) {
        fetch(`${DBHelper.SERVER_URL}/api/count/${name.value}/timestamp`, {
          headers: {
            'Content-Type': 'application/json; charset=utf-8'
          },
          method: 'PUT',
          body: JSON.stringify({
            update_clock: !byTimestamp,
            timestamp: byTimestamp
              ? { data: timestamp.value }
              : storedTimestamp
              ? storedTimestamp
              : { data: 'null' }
          })
        })
          .then(function(response) {
            return response.json();
          })
          .then(function(json) {
            DBHelper.crdtDBPromise
              .then(function(db) {
                if (!db || byTimestamp) return;

                var tx = db.transaction('crdt-states', 'readwrite');
                var store = tx.objectStore('crdt-states');

                var item = new CounterCRDT(name.value, json.cont);

                store.put(item);

                let setSelector = document.getElementById('set-name-field');
                fillSelectsEls([name, setSelector]);
                return tx.complete;
              })
              .then(function() {
                DBHelper.crdtDBPromise.then(function(db) {
                  if (!db || byTimestamp) return;

                  var tx = db.transaction('crdt-timestamps', 'readwrite');
                  var store = tx.objectStore('crdt-timestamps');
                  var temp = json.lastCommitTimestamp;

                  if (temp) {
                    log(`Timestamp: ${temp}`);
                    store.put({ id: 0, data: temp });
                  }

                  return tx.complete;
                });
              });
            log(`The value of ${name.value} is: ${json.cont}`);
          })
          .catch(function() {
            // TODO add the functionality when the key is not created yet and don't forget to recreate the select element
            DBHelper.crdtDBPromise.then(function(db) {
              if (!db) return;

              var index = db.transaction('crdt-states').objectStore('crdt-states');

              return index.get(name.value).then(function(state) {
                if (state) {
                  Object.setPrototypeOf(state, CounterCRDT.prototype);

                  log(`[Offline] The value of ${name.value} is: ${state.calculateState()}`);
                } else {
                  log('[Offline] Selected key is not available offline.');
                }
              });
            });
          });
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

  liIncBtn.appendChild(labelIncBtn);
  liIncBtn.appendChild(document.createElement('br'));
  liIncBtn.appendChild(incBtn);

  incBtn.onclick = function() {
    requestCounterSync();
    log(`Incrementing the value of ${name.value}`);

    fetch(`${DBHelper.SERVER_URL}/api/count/${name.value}`, {
      method: 'PUT',
      body: JSON.stringify({
        // TODO decide whether you want to apply changes only on the timestamp that is stored in the web-browser
        // TODO FIX of the problem with adding and then removing a value from a set without pressing GET
        lastCommitTimestamp: timestamp.value === '' ? undefined : { id: 0, data: timestamp.value }
      }),
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

            var index = db.transaction('crdt-states').objectStore('crdt-states');

            return index.get(name.value).then(function(val) {
              var tx = db.transaction('crdt-states', 'readwrite');
              var store = tx.objectStore('crdt-states');

              var item = val;

              // TODO check on !val
              Object.setPrototypeOf(item, CounterCRDT.prototype);

              item.inc();
              store.put(item);

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

  liDecBtn.appendChild(labelDecBtn);
  liDecBtn.appendChild(document.createElement('br'));
  liDecBtn.appendChild(decBtn);

  decBtn.onclick = function() {
    requestCounterSync();
    log(`Decrementing the value of ${name.value}`);

    fetch(`${DBHelper.SERVER_URL}/api/count/${name.value}`, {
      method: 'DELETE',
      body: JSON.stringify({
        // TODO decide whether you want to apply changes only on the timestamp that is stored in the web-browser
        // TODO FIX of the problem with adding and then removing a value from a set without pressing GET
        lastCommitTimestamp: timestamp.value === '' ? undefined : { id: 0, data: timestamp.value }
      }),
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

            var index = db.transaction('crdt-states').objectStore('crdt-states');

            return index.get(name.value).then(function(val) {
              var tx = db.transaction('crdt-states', 'readwrite');
              var store = tx.objectStore('crdt-states');

              var item = val;
              // TODO check on !val
              Object.setPrototypeOf(item, CounterCRDT.prototype);

              item.dec();
              store.put(item);

              return tx.complete;
            });
          })
          .catch(function() {
            // TODO throw an error
          });

        //log(`Failed to decrement the id ${name.value}: ${error}`);
      });
  };

  /**
   * Creating the 'remove' button:
   */

  const liDelBtn = document.createElement('li');

  const delBtn = document.createElement('button');
  delBtn.id = 'delbtn-counter';
  delBtn.innerHTML = 'Delete selected id from cache!';
  delBtn.type = 'button';

  const labelDelBtn = document.createElement('label');
  labelDelBtn.setAttribute('for', delBtn.id);

  liDelBtn.appendChild(labelDelBtn);
  liDelBtn.appendChild(document.createElement('br'));
  liDelBtn.appendChild(delBtn);

  delBtn.onclick = function() {
    var decision = confirm(
      `Are you sure you want to remove the value of a key ${name.value} from the cache?`
    );

    if (decision) {
      log(`Removing the requested key - ${name.value} - of a counter from the cache...`);
      DBHelper.crdtDBPromise
        .then(function(db) {
          if (!db) return;

          var index = db.transaction('crdt-states').objectStore('crdt-states');

          return index.get(name.value).then(function(val) {
            if (val) {
              var tx = db.transaction('crdt-states', 'readwrite');
              var store = tx.objectStore('crdt-states');
              store.delete(name.value);
              log(`The key ${name.value} of a counter was successfully removed from the cache.`);
              return tx.complete;
            } else {
              log(`The requested key - ${name.value} - was not found in the cache`);
            }
          });
        })
        .catch(function() {
          log(
            `Error! Unfortunately, it was not possible to remove the requested id - ${
              name.value
            } - of a counter from the cache.`
          );
        });
    } else {
      log('Removal cancelled');
    }
  };

  // Add everything to the form
  li.appendChild(liNameLabel);
  li.appendChild(liName);
  li.appendChild(liTimestampName);
  li.appendChild(liTimestamp);
  li.appendChild(liGetBtn);
  li.appendChild(liIncBtn);
  li.appendChild(liDecBtn);
  li.appendChild(liDelBtn);
  form.appendChild(li);
  mainContainer.appendChild(form);
};

/**
 * Add the form for interacting with a sets-aw CRDT
 *
 */
const addSetForm = () => {
  const mainContainer = document.getElementById('set_aw-options');
  const form = document.createElement('form');
  const li = document.createElement('ul');

  const liName = document.createElement('li');
  const liNameLabel = document.createElement('li');

  const name = document.createElement('select');
  name.name = 'name';
  name.id = 'set-name-field';
  name.placeholder = 'Enter the set name';

  fillSelectsEls([name]);

  const labelName = document.createElement('label');
  labelName.setAttribute('for', name.id);
  labelName.innerHTML = 'Set Id';

  liNameLabel.appendChild(labelName);
  liName.appendChild(document.createElement('br'));
  liName.appendChild(name);

  const liValue = document.createElement('li');
  const liValueName = document.createElement('li');

  const value = document.createElement('input');
  value.type = 'text';
  value.name = 'value';
  value.id = 'set-value-field';
  value.placeholder = 'Enter the element to add';

  const labelValue = document.createElement('label');
  labelValue.setAttribute('for', value.id);
  labelValue.innerHTML = 'Element';

  liValueName.appendChild(labelValue);
  liValue.appendChild(document.createElement('br'));
  liValue.appendChild(value);

  const liTimestamp = document.createElement('li');
  const liTimestampName = document.createElement('li');

  const timestamp = document.createElement('input');
  timestamp.type = 'text';
  timestamp.name = 'timestamp';
  timestamp.id = 'set-timestamp-field';
  timestamp.placeholder = 'Enter the timestamp to read (optional)';

  const labelTimestamp = document.createElement('label');
  labelTimestamp.setAttribute('for', timestamp.id);
  labelTimestamp.innerHTML = 'Timestamp';

  liTimestampName.appendChild(labelTimestamp);
  liTimestamp.appendChild(document.createElement('br'));
  liTimestamp.appendChild(timestamp);

  /**
   * Creating the 'get' button:
   */

  const liGetBtn = document.createElement('li');

  const getBtn = document.createElement('button');
  getBtn.id = 'set-getbtn-field';
  getBtn.innerHTML = 'Get Set!';
  getBtn.type = 'button';

  const labelGetBtn = document.createElement('label');
  labelGetBtn.setAttribute('for', getBtn.id);

  liGetBtn.appendChild(labelGetBtn);
  liGetBtn.appendChild(document.createElement('br'));
  liGetBtn.appendChild(getBtn);

  getBtn.onclick = function() {
    const byTimestamp = timestamp.value !== '';
    log(`Getting ${name.value} set`);

    DBHelper.crdtDBPromise.then(function(db) {
      if (!db) return;
      var index = db.transaction('crdt-timestamps').objectStore('crdt-timestamps');
      return index.get(0).then(function(storedTimestamp) {
        fetch(`${DBHelper.SERVER_URL}/api/set/${name.value}/timestamp`, {
          headers: {
            'Content-Type': 'application/json; charset=utf-8'
          },
          method: 'PUT',
          body: JSON.stringify({
            update_clock: !byTimestamp,
            timestamp: byTimestamp
              ? { data: timestamp.value }
              : storedTimestamp
              ? storedTimestamp
              : { data: 'null' }
          })
        })
          .then(function(response) {
            return response.json();
          })
          .then(function(json) {
            DBHelper.crdtDBPromise
              .then(function(db) {
                if (!db || byTimestamp) return;

                var tx = db.transaction('crdt-states', 'readwrite');
                var store = tx.objectStore('crdt-states');

                var item = new SetCRDT(name.value, json.cont);

                store.put(item);
                let counterSelector = document.getElementById('counter-name-field');
                fillSelectsEls([name, counterSelector]);
                return tx.complete;
              })
              .then(function() {
                DBHelper.crdtDBPromise.then(function(db) {
                  if (!db || byTimestamp) return;

                  var tx = db.transaction('crdt-timestamps', 'readwrite');
                  var store = tx.objectStore('crdt-timestamps');
                  var temp = json.lastCommitTimestamp;

                  if (temp) {
                    log(`Timestamp: ${temp}`);
                    store.put({ id: 0, data: temp });
                  }

                  return tx.complete;
                });
              });
            log(`The value of ${name.value} is: [ ${json.cont} ]`);
          })
          .catch(function() {
            // TODO add the functionality when the key is not created yet and don't forget to recreate the select element
            DBHelper.crdtDBPromise.then(function(db) {
              if (!db) return;

              var index = db.transaction('crdt-states').objectStore('crdt-states');

              return index.get(name.value).then(function(state) {
                if (state) {
                  Object.setPrototypeOf(state, SetCRDT.prototype);
                  log(`[Offline] The value of ${name.value} is: [ ${state.calculateState()} ]`);
                } else {
                  log('[Offline] Selected key is not available offline.');
                }
              });
            });
          });
      });
    });
  };

  /**
   * Creating the 'inc' button:
   */

  const liAddBtn = document.createElement('li');

  const addBtn = document.createElement('button');
  addBtn.id = 'addbtn-field';
  addBtn.innerHTML = 'Add to the set!';
  addBtn.type = 'button';

  const labelIncBtn = document.createElement('label');
  labelIncBtn.setAttribute('for', addBtn.id);

  liAddBtn.appendChild(labelIncBtn);
  liAddBtn.appendChild(document.createElement('br'));
  liAddBtn.appendChild(addBtn);

  addBtn.onclick = function() {
    if (value.value !== '') {
      requestSetSync();
      log(`Adding to the set ${name.value} the value of ${value.value}`);

      fetch(`${DBHelper.SERVER_URL}/api/set/${name.value}`, {
        method: 'PUT',
        body: JSON.stringify({
          value: value.value,
          // TODO decide whether you want to apply changes only on the timestamp that is stored in the web-browser
          // TODO FIX of the problem with adding and then removing a value from a set without pressing GET
          lastCommitTimestamp: timestamp.value === '' ? undefined : { id: 0, data: timestamp.value }
        }),
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

              var index = db.transaction('crdt-states').objectStore('crdt-states');

              return index.get(name.value).then(function(val) {
                var tx = db.transaction('crdt-states', 'readwrite');
                var store = tx.objectStore('crdt-states');

                var item = val;

                Object.setPrototypeOf(item, SetCRDT.prototype);
                item.add(value.value);
                store.put(item);

                return tx.complete;
              });
            })
            .catch(function() {
              // TODO throw an error
            });
          //log(`Failed to increment the id ${name.value}: ${error}`);
        });
    } else {
      alert('Please, fill in all the fields!');
    }
  };

  /**
   * Creating the 'dec' button:
   */

  const liDecBtn = document.createElement('li');

  const decBtn = document.createElement('button');
  decBtn.id = 'rembtn-field';
  decBtn.innerHTML = 'Remove from the set!';
  decBtn.type = 'button';

  const labelDecBtn = document.createElement('label');
  labelDecBtn.setAttribute('for', decBtn.id);

  liDecBtn.appendChild(labelDecBtn);
  liDecBtn.appendChild(document.createElement('br'));
  liDecBtn.appendChild(decBtn);

  decBtn.onclick = function() {
    if (value.value !== '') {
      requestSetSync();
      log(`Removing from the set ${name.value} the value of ${value.value}`);
      fetch(`${DBHelper.SERVER_URL}/api/set/${name.value}`, {
        method: 'DELETE',
        body: JSON.stringify({
          value: value.value,
          // TODO decide whether you want to apply changes only on the timestamp that is stored in the web-browser
          // TODO FIX of the problem with adding and then removing a value from a set without pressing GET
          lastCommitTimestamp: timestamp.value === '' ? undefined : { id: 0, data: timestamp.value }
        }),
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

              var index = db.transaction('crdt-states').objectStore('crdt-states');

              return index.get(name.value).then(function(val) {
                var tx = db.transaction('crdt-states', 'readwrite');
                var store = tx.objectStore('crdt-states');

                var item = val;

                Object.setPrototypeOf(item, SetCRDT.prototype);
                item.remove(value.value);
                store.put(item);

                return tx.complete;
              });
            })
            .catch(function() {
              // TODO throw an error
            });
          //log(`Failed to increment the id ${name.value}: ${error}`);
        });
    } else {
      alert('Please, fill in all the fields!');
    }
  };

  /**
   * Creating the 'remove' button:
   */

  const liDelBtn = document.createElement('li');

  const delBtn = document.createElement('button');
  delBtn.id = 'delbtn-set';
  delBtn.innerHTML = 'Delete selected id from cache!';
  delBtn.type = 'button';

  const labelDelBtn = document.createElement('label');
  labelDelBtn.setAttribute('for', delBtn.id);

  liDelBtn.appendChild(labelDelBtn);
  liDelBtn.appendChild(document.createElement('br'));
  liDelBtn.appendChild(delBtn);

  delBtn.onclick = function() {
    var decision = confirm(
      `Are you sure you want to remove the value of a key ${name.value} from the cache?`
    );

    if (decision) {
      log(`Removing the requested key - ${name.value} - of a set from the cache...`);
      DBHelper.crdtDBPromise
        .then(function(db) {
          if (!db) return;

          var index = db.transaction('crdt-states').objectStore('crdt-states');

          return index.get(name.value).then(function(val) {
            if (val) {
              var tx = db.transaction('crdt-states', 'readwrite');
              var store = tx.objectStore('crdt-states');
              store.delete(name.value);
              log(`The key ${name.value} of a set was successfully removed from the cache.`);
              return tx.complete;
            } else {
              log(`The requested key - ${name.value} - was not found in the cache`);
            }
          });
        })
        .catch(function() {
          log(
            `Error! Unfortunately, it was not possible to remove the requested id - ${
              name.value
            } - of a set from the cache.`
          );
        });
    } else {
      log('Removal cancelled');
    }
  };

  // Add everything to the form
  li.appendChild(liNameLabel);
  li.appendChild(liName);
  li.appendChild(liValueName);
  li.appendChild(liValue);
  li.appendChild(liTimestampName);
  li.appendChild(liTimestamp);
  li.appendChild(liGetBtn);
  li.appendChild(liAddBtn);
  li.appendChild(liDecBtn);
  li.appendChild(liDelBtn);
  form.appendChild(li);
  mainContainer.appendChild(form);
};

/**
 * Add the form for interacting with a MVRegister CRDT
 *
 */
const addMVRegisterForm = () => {
  const mainContainer = document.getElementById('mvr-options');
  const form = document.createElement('form');
  const li = document.createElement('ul');

  const liName = document.createElement('li');
  const liNameLabel = document.createElement('li');

  const name = document.createElement('select');
  name.name = 'name';
  name.id = 'mvregister-name-field';
  name.placeholder = 'Enter the MVR name';

  fillSelectsEls([name]);

  const labelName = document.createElement('label');
  labelName.setAttribute('for', name.id);
  labelName.innerHTML = 'MVR Id';

  liNameLabel.appendChild(labelName);
  liName.appendChild(document.createElement('br'));
  liName.appendChild(name);

  const liValue = document.createElement('li');
  const liValueName = document.createElement('li');

  const value = document.createElement('input');
  value.type = 'text';
  value.name = 'value';
  value.id = 'mvr-value-field';
  value.placeholder = 'Enter the element to assign';

  const labelValue = document.createElement('label');
  labelValue.setAttribute('for', value.id);
  labelValue.innerHTML = 'Element';

  liValueName.appendChild(labelValue);
  liValue.appendChild(document.createElement('br'));
  liValue.appendChild(value);

  const liTimestamp = document.createElement('li');
  const liTimestampName = document.createElement('li');

  const timestamp = document.createElement('input');
  timestamp.type = 'text';
  timestamp.name = 'timestamp';
  timestamp.id = 'mvr-timestamp-field';
  timestamp.placeholder = 'Enter the timestamp to read (optional)';

  const labelTimestamp = document.createElement('label');
  labelTimestamp.setAttribute('for', timestamp.id);
  labelTimestamp.innerHTML = 'Timestamp';

  liTimestampName.appendChild(labelTimestamp);
  liTimestamp.appendChild(document.createElement('br'));
  liTimestamp.appendChild(timestamp);

  /**
   * Creating the 'get' button:
   */

  const liGetBtn = document.createElement('li');

  const getBtn = document.createElement('button');
  getBtn.id = 'mvr-getbtn-field';
  getBtn.innerHTML = 'Get MVR!';
  getBtn.type = 'button';

  const labelGetBtn = document.createElement('label');
  labelGetBtn.setAttribute('for', getBtn.id);

  liGetBtn.appendChild(labelGetBtn);
  liGetBtn.appendChild(document.createElement('br'));
  liGetBtn.appendChild(getBtn);

  getBtn.onclick = function() {
    const byTimestamp = timestamp.value !== '';
    log(`Getting ${name.value} MVR`);

    DBHelper.crdtDBPromise.then(function(db) {
      if (!db) return;
      var index = db.transaction('crdt-timestamps').objectStore('crdt-timestamps');
      return index.get(0).then(function(storedTimestamp) {
        fetch(`${DBHelper.SERVER_URL}/api/mvr/${name.value}/timestamp`, {
          headers: {
            'Content-Type': 'application/json; charset=utf-8'
          },
          method: 'PUT',
          body: JSON.stringify({
            update_clock: !byTimestamp,
            timestamp: byTimestamp
              ? { data: timestamp.value }
              : storedTimestamp
              ? storedTimestamp
              : { data: 'null' }
          })
        })
          .then(function(response) {
            return response.json();
          })
          .then(function(json) {
            DBHelper.crdtDBPromise
              .then(function(db) {
                if (!db || byTimestamp) return;

                var tx = db.transaction('crdt-states', 'readwrite');
                var store = tx.objectStore('crdt-states');

                var item = new MVRegisterCRDT(name.value, json.cont);

                store.put(item);
                let counterSelector = document.getElementById('counter-name-field');
                let setSelector = document.getElementById('set-name-field');
                fillSelectsEls([name, counterSelector, setSelector]);
                return tx.complete;
              })
              .then(function() {
                DBHelper.crdtDBPromise.then(function(db) {
                  if (!db || byTimestamp) return;

                  var tx = db.transaction('crdt-timestamps', 'readwrite');
                  var store = tx.objectStore('crdt-timestamps');
                  var temp = json.lastCommitTimestamp;

                  if (temp) {
                    log(`Timestamp: ${temp}`);
                    store.put({ id: 0, data: temp });
                  }

                  return tx.complete;
                });
              });
            log(`The value of ${name.value} is: [ ${json.cont} ]`);
          })
          .catch(function() {
            // TODO add the functionality when the key is not created yet and don't forget to recreate the select element
            DBHelper.crdtDBPromise.then(function(db) {
              if (!db) return;

              var index = db.transaction('crdt-states').objectStore('crdt-states');

              return index.get(name.value).then(function(state) {
                if (state) {
                  Object.setPrototypeOf(state, MVRegisterCRDT.prototype);
                  log(`[Offline] The value of ${name.value} is: [ ${state.calculateState()} ]`);
                } else {
                  log('[Offline] Selected key is not available offline.');
                }
              });
            });
          });
      });
    });
  };

  /**
   * Creating the 'assign' button:
   */

  const liAssignBtn = document.createElement('li');

  const assignBtn = document.createElement('button');
  assignBtn.id = 'assignbtn-field';
  assignBtn.innerHTML = 'Assign to the MVR!';
  assignBtn.type = 'button';

  const labelAssignBtn = document.createElement('label');
  labelAssignBtn.setAttribute('for', assignBtn.id);

  liAssignBtn.appendChild(labelAssignBtn);
  liAssignBtn.appendChild(document.createElement('br'));
  liAssignBtn.appendChild(assignBtn);

  assignBtn.onclick = function() {
    if (value.value !== '') {
      requestMVRSync();
      log(`Adding to the set ${name.value} the value of ${value.value}`);

      fetch(`${DBHelper.SERVER_URL}/api/mvr/${name.value}`, {
        method: 'PUT',
        body: JSON.stringify({
          value: value.value,
          // TODO decide whether you want to apply changes only on the timestamp that is stored in the web-browser
          lastCommitTimestamp: timestamp.value === '' ? undefined : { id: 0, data: timestamp.value }
        }),
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

              var index = db.transaction('crdt-states').objectStore('crdt-states');

              return index.get(name.value).then(function(val) {
                var tx = db.transaction('crdt-states', 'readwrite');
                var store = tx.objectStore('crdt-states');

                var item = val;
                debugger;
                Object.setPrototypeOf(item, MVRegisterCRDT.prototype);
                item.assign(value.value);
                store.put(item);

                return tx.complete;
              });
            })
            .catch(function() {
              // TODO throw an error
            });
          //log(`Failed to increment the id ${name.value}: ${error}`);
        });
    } else {
      alert('Please, fill in all the fields!');
    }
  };

  /**
   * Creating the 'reset' button:
   */

  const liResetBtn = document.createElement('li');

  const resetBtn = document.createElement('button');
  resetBtn.id = 'resetbtn-field';
  resetBtn.innerHTML = 'Reset the MVR!';
  resetBtn.type = 'button';

  const labelResetBtn = document.createElement('label');
  labelResetBtn.setAttribute('for', resetBtn.id);

  liResetBtn.appendChild(labelResetBtn);
  liResetBtn.appendChild(document.createElement('br'));
  liResetBtn.appendChild(resetBtn);

  resetBtn.onclick = function() {
    requestMVRSync();
    log(`Resetting the MVRegister ${name.value}`);
    fetch(`${DBHelper.SERVER_URL}/api/mvr/${name.value}`, {
      method: 'DELETE',
      body: JSON.stringify({
        value: value.value,
        // TODO decide whether you want to apply changes only on the timestamp that is stored in the web-browser
        // TODO FIX of the problem with adding and then removing a value from a set without pressing GET
        lastCommitTimestamp: timestamp.value === '' ? undefined : { id: 0, data: timestamp.value }
      }),
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

            var index = db.transaction('crdt-states').objectStore('crdt-states');

            return index.get(name.value).then(function(val) {
              var tx = db.transaction('crdt-states', 'readwrite');
              var store = tx.objectStore('crdt-states');

              var item = val;

              Object.setPrototypeOf(item, MVRegisterCRDT.prototype);
              debugger;
              item.reset();
              store.put(item);

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
   * Creating the 'remove' button:
   */

  const liDelBtn = document.createElement('li');

  const delBtn = document.createElement('button');
  delBtn.id = 'delbtn-mvr';
  delBtn.innerHTML = 'Delete selected id from cache!';
  delBtn.type = 'button';

  const labelDelBtn = document.createElement('label');
  labelDelBtn.setAttribute('for', delBtn.id);

  liDelBtn.appendChild(labelDelBtn);
  liDelBtn.appendChild(document.createElement('br'));
  liDelBtn.appendChild(delBtn);

  delBtn.onclick = function() {
    var decision = confirm(
      `Are you sure you want to remove the value of a key ${name.value} from the cache?`
    );

    if (decision) {
      log(`Removing the requested key - ${name.value} - of a MVR from the cache...`);
      DBHelper.crdtDBPromise
        .then(function(db) {
          if (!db) return;

          var index = db.transaction('crdt-states').objectStore('crdt-states');

          return index.get(name.value).then(function(val) {
            if (val) {
              var tx = db.transaction('crdt-states', 'readwrite');
              var store = tx.objectStore('crdt-states');
              store.delete(name.value);
              log(`The key ${name.value} of a set was successfully removed from the cache.`);
              return tx.complete;
            } else {
              log(`The requested key - ${name.value} - was not found in the cache`);
            }
          });
        })
        .catch(function() {
          log(
            `Error! Unfortunately, it was not possible to remove the requested id - ${
              name.value
            } - of a set from the cache.`
          );
        });
    } else {
      log('Removal cancelled');
    }
  };

  // Add everything to the form
  li.appendChild(liNameLabel);
  li.appendChild(liName);
  li.appendChild(liValueName);
  li.appendChild(liValue);
  li.appendChild(liTimestampName);
  li.appendChild(liTimestamp);
  li.appendChild(liGetBtn);
  li.appendChild(liAssignBtn);
  li.appendChild(liResetBtn);
  li.appendChild(liDelBtn);
  form.appendChild(li);
  mainContainer.appendChild(form);
};

/**
 * Add the form for interacting with a Map CRDT
 *
 */
const addMapForm = () => {
  const mainContainer = document.getElementById('map-options');
  const form = document.createElement('form');
  const li = document.createElement('ul');

  const liName = document.createElement('li');
  const liNameLabel = document.createElement('li');

  const name = document.createElement('select');
  name.name = 'name';
  name.id = 'map-name-field';
  name.placeholder = 'Enter the Map name';

  const liType = document.createElement('li');
  const liTypeLabel = document.createElement('li');

  const type = document.createElement('select');
  type.name = 'type';
  type.id = 'map-type-field';

  const mvr_option = document.createElement('option');
  mvr_option.value = 'mvr';
  mvr_option.innerHTML = 'Multi-Value Register';

  const set_option = document.createElement('option');
  set_option.value = 'set';
  set_option.innerHTML = 'Set';

  const counter_option = document.createElement('option');
  counter_option.value = 'counter';
  counter_option.innerHTML = 'Counter';
  counter_option.selected = true;

  type.appendChild(mvr_option);
  type.appendChild(counter_option);
  type.appendChild(set_option);

  const labelType = document.createElement('label');
  labelType.setAttribute('for', type.id);
  labelType.innerHTML = 'Type of Map';

  liTypeLabel.appendChild(labelType);
  liType.appendChild(document.createElement('br'));
  liType.appendChild(type);

  fillSelectsEls([name]);

  const labelName = document.createElement('label');
  labelName.setAttribute('for', name.id);
  labelName.innerHTML = 'Map Id';

  liNameLabel.appendChild(labelName);
  liName.appendChild(document.createElement('br'));
  liName.appendChild(name);

  const liValue = document.createElement('li');
  const liValueName = document.createElement('li');

  const value = document.createElement('input');
  value.type = 'text';
  value.name = 'value';
  value.id = 'map-value-field';
  value.placeholder = 'Enter the element to assign';

  const labelValue = document.createElement('label');
  labelValue.setAttribute('for', value.id);
  labelValue.innerHTML = 'Element';

  liValueName.appendChild(labelValue);
  liValue.appendChild(document.createElement('br'));
  liValue.appendChild(value);

  const liTimestamp = document.createElement('li');
  const liTimestampName = document.createElement('li');

  const timestamp = document.createElement('input');
  timestamp.type = 'text';
  timestamp.name = 'timestamp';
  timestamp.id = 'map-timestamp-field';
  timestamp.placeholder = 'Enter the timestamp to read (optional)';

  const labelTimestamp = document.createElement('label');
  labelTimestamp.setAttribute('for', timestamp.id);
  labelTimestamp.innerHTML = 'Timestamp';

  liTimestampName.appendChild(labelTimestamp);
  liTimestamp.appendChild(document.createElement('br'));
  liTimestamp.appendChild(timestamp);

  /**
   * Creating the 'get' button:
   */

  const liGetBtn = document.createElement('li');

  const getBtn = document.createElement('button');
  getBtn.id = 'map-getbtn-field';
  getBtn.innerHTML = 'Get Map!';
  getBtn.type = 'button';

  const labelGetBtn = document.createElement('label');
  labelGetBtn.setAttribute('for', getBtn.id);

  liGetBtn.appendChild(labelGetBtn);
  liGetBtn.appendChild(document.createElement('br'));
  liGetBtn.appendChild(getBtn);

  getBtn.onclick = function() {
    const byTimestamp = timestamp.value !== '';
    log(`Getting ${name.value} Map`);

    DBHelper.crdtDBPromise.then(function(db) {
      if (!db) return;
      var index = db.transaction('crdt-timestamps').objectStore('crdt-timestamps');
      return index.get(0).then(function(storedTimestamp) {
        debugger;
        fetch(`${DBHelper.SERVER_URL}/api/map/${name.value}/timestamp`, {
          headers: {
            'Content-Type': 'application/json; charset=utf-8'
          },
          method: 'PUT',
          body: JSON.stringify({
            update_clock: !byTimestamp,
            timestamp: byTimestamp
              ? { data: timestamp.value }
              : storedTimestamp
              ? storedTimestamp
              : { data: 'null' }
          })
        })
          .then(function(response) {
            return response.json();
          })
          .then(function(json) {
            DBHelper.crdtDBPromise
              .then(function(db) {
                if (!db || byTimestamp) return;

                var tx = db.transaction('crdt-states', 'readwrite');
                var store = tx.objectStore('crdt-states');
                debugger;
                var item = new MapCRDT(name.value, json.cont.entries);

                store.put(item);
                let counterSelector = document.getElementById('counter-name-field');
                let setSelector = document.getElementById('set-name-field');
                let mvrSelector = document.getElementById('mvregister-name-field');
                fillSelectsEls([name, counterSelector, setSelector, mvrSelector]);
                return tx.complete;
              })
              .then(function() {
                DBHelper.crdtDBPromise.then(function(db) {
                  if (!db || byTimestamp) return;

                  var tx = db.transaction('crdt-timestamps', 'readwrite');
                  var store = tx.objectStore('crdt-timestamps');
                  var temp = json.lastCommitTimestamp;

                  if (temp) {
                    log(`Timestamp: ${temp}`);
                    store.put({ id: 0, data: temp });
                  }

                  return tx.complete;
                });
              });
            log(`The value of ${name.value} is: [ ${json.cont.entries} ]`);
          })
          .catch(function() {
            // TODO add the functionality when the key is not created yet and don't forget to recreate the select element
            DBHelper.crdtDBPromise.then(function(db) {
              if (!db) return;

              var index = db.transaction('crdt-states').objectStore('crdt-states');

              return index.get(name.value).then(function(state) {
                if (state) {
                  Object.setPrototypeOf(state, MapCRDT.prototype);
                  log(`[Offline] The value of ${name.value} is: [ ${state.calculateState()} ]`);
                } else {
                  log('[Offline] Selected key is not available offline.');
                }
              });
            });
          });
      });
    });
  };

  /**
   * Creating the 'assign' button:
   */

  const liAssignBtn = document.createElement('li');

  const assignBtn = document.createElement('button');
  assignBtn.id = 'assignbtn-field';
  assignBtn.innerHTML = 'Assign to the MVR!';
  assignBtn.type = 'button';

  const labelAssignBtn = document.createElement('label');
  labelAssignBtn.setAttribute('for', assignBtn.id);

  liAssignBtn.appendChild(labelAssignBtn);
  liAssignBtn.appendChild(document.createElement('br'));
  liAssignBtn.appendChild(assignBtn);

  assignBtn.onclick = function() {
    if (value.value !== '') {
      requestMapSync();
      log(`Adding to the set ${name.value} the value of ${value.value}`);

      fetch(`${DBHelper.SERVER_URL}/api/mvr/${name.value}`, {
        method: 'PUT',
        body: JSON.stringify({
          value: value.value,
          // TODO decide whether you want to apply changes only on the timestamp that is stored in the web-browser
          lastCommitTimestamp: timestamp.value === '' ? undefined : { id: 0, data: timestamp.value }
        }),
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

              var index = db.transaction('crdt-states').objectStore('crdt-states');

              return index.get(name.value).then(function(val) {
                var tx = db.transaction('crdt-states', 'readwrite');
                var store = tx.objectStore('crdt-states');

                var item = val;
                debugger;
                Object.setPrototypeOf(item, MVRegisterCRDT.prototype);
                item.assign(value.value);
                store.put(item);

                return tx.complete;
              });
            })
            .catch(function() {
              // TODO throw an error
            });
          //log(`Failed to increment the id ${name.value}: ${error}`);
        });
    } else {
      alert('Please, fill in all the fields!');
    }
  };

  /**
   * Creating the 'reset' button:
   */

  const liResetBtn = document.createElement('li');

  const resetBtn = document.createElement('button');
  resetBtn.id = 'resetbtn-field';
  resetBtn.innerHTML = 'Reset the MVR!';
  resetBtn.type = 'button';

  const labelResetBtn = document.createElement('label');
  labelResetBtn.setAttribute('for', resetBtn.id);

  liResetBtn.appendChild(labelResetBtn);
  liResetBtn.appendChild(document.createElement('br'));
  liResetBtn.appendChild(resetBtn);

  resetBtn.onclick = function() {
    requestMapSync();
    log(`Resetting the MVRegister ${name.value}`);
    fetch(`${DBHelper.SERVER_URL}/api/mvr/${name.value}`, {
      method: 'DELETE',
      body: JSON.stringify({
        value: value.value,
        // TODO decide whether you want to apply changes only on the timestamp that is stored in the web-browser
        // TODO FIX of the problem with adding and then removing a value from a set without pressing GET
        lastCommitTimestamp: timestamp.value === '' ? undefined : { id: 0, data: timestamp.value }
      }),
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

            var index = db.transaction('crdt-states').objectStore('crdt-states');

            return index.get(name.value).then(function(val) {
              var tx = db.transaction('crdt-states', 'readwrite');
              var store = tx.objectStore('crdt-states');

              var item = val;

              Object.setPrototypeOf(item, MVRegisterCRDT.prototype);
              debugger;
              item.reset();
              store.put(item);

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
   * Creating the 'remove' button:
   */

  const liDelBtn = document.createElement('li');

  const delBtn = document.createElement('button');
  delBtn.id = 'delbtn-mvr';
  delBtn.innerHTML = 'Delete selected id from cache!';
  delBtn.type = 'button';

  const labelDelBtn = document.createElement('label');
  labelDelBtn.setAttribute('for', delBtn.id);

  liDelBtn.appendChild(labelDelBtn);
  liDelBtn.appendChild(document.createElement('br'));
  liDelBtn.appendChild(delBtn);

  delBtn.onclick = function() {
    var decision = confirm(
      `Are you sure you want to remove the value of a key ${name.value} from the cache?`
    );

    if (decision) {
      log(`Removing the requested key - ${name.value} - of a MVR from the cache...`);
      DBHelper.crdtDBPromise
        .then(function(db) {
          if (!db) return;

          var index = db.transaction('crdt-states').objectStore('crdt-states');

          return index.get(name.value).then(function(val) {
            if (val) {
              var tx = db.transaction('crdt-states', 'readwrite');
              var store = tx.objectStore('crdt-states');
              store.delete(name.value);
              log(`The key ${name.value} of a set was successfully removed from the cache.`);
              return tx.complete;
            } else {
              log(`The requested key - ${name.value} - was not found in the cache`);
            }
          });
        })
        .catch(function() {
          log(
            `Error! Unfortunately, it was not possible to remove the requested id - ${
              name.value
            } - of a set from the cache.`
          );
        });
    } else {
      log('Removal cancelled');
    }
  };

  // Add everything to the form
  li.appendChild(liNameLabel);
  li.appendChild(liName);
  li.appendChild(liTypeLabel);
  li.appendChild(liType);
  li.appendChild(liValueName);
  li.appendChild(liValue);
  li.appendChild(liTimestampName);
  li.appendChild(liTimestamp);
  li.appendChild(liGetBtn);
  li.appendChild(liAssignBtn);
  li.appendChild(liResetBtn);
  li.appendChild(liDelBtn);
  form.appendChild(li);
  mainContainer.appendChild(form);
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
