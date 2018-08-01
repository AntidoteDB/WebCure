/**
 * Register Service Worker and manipulate the content on load
 */
/*global DBHelper Logger log :true*/

window.addEventListener('load', () => {
  registerServiceWorker();
  Logger.show();
  Logger.open();
  addCounterForm();
});

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
    fetch(`/api/1/count/${name.value}`, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      }
    })
      .then(function(response) {
        return response.json();
      })
      .then(function(json) {
        log(`The value of ${name.value} is: ${json.cont}`);
      })
      .catch(function(error) {
        log(`Failed to get the value of ${name.value}: ${error}`);
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
    log(`Decrementing the value of ${name.value}`);
    fetch(`/api/1/count/${name.value}`, {
      method: 'PUT',
      data: `value=${1}`,
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      }
    })
      .then(function(response) {
        return response.json();
      })
      .then(function(json) {
        log(`The response for id ${name.value} is: ${json.status}`);
      })
      .catch(function(error) {
        log(`Failed to decrement the id ${name.value}: ${error}`);
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
    log(`Decrementing the value of ${name.value}`);
    fetch(`/api/1/count/${name.value}`, {
      method: 'DELETE',
      data: `value=${1}`,
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      }
    })
      .then(function(response) {
        return response.json();
      })
      .then(function(json) {
        log(`The response for id ${name.value} is: ${json.status}`);
      })
      .catch(function(error) {
        log(`Failed to increment the id ${name.value}: ${error}`);
      });
  };

  // Add everything to the form
  li.appendChild(liName);
  li.appendChild(liGetBtn);
  li.appendChild(liIncBtn);
  li.appendChild(liDecBtn);
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
