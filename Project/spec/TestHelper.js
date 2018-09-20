/* eslint-disable no-unused-vars */
const request = require('request');
const endpoint = 'http://localhost:3001';

class TestHelper {
  /* eslint-enable  no-unused-vars */
  static checkAppAvailability(page, callback) {
    request.get(endpoint + (page ? '/index.html' : ''), function(error, response) {
      console.log('Response StatusCode: ', response.statusCode);
      expect(response.statusCode).toEqual(200);
      callback();
    });
  }

  static checkGet(type, id, value, callback, element) {
    if (!element) {
      element = { update_clock: true, timestamp: { data: 'null' } };
    }

    if (type === 'counter') {
      request.put(
        {
          url: endpoint + '/api/count/' + id + '/timestamp',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(element)
        },
        function(error, response) {
          expect(response).toBeDefined();
          let result = JSON.parse(response.body);
          expect(result.status).toEqual('OK');
          expect(result.cont).toEqual(value);
          expect(result.lastCommitTimestamp).not.toEqual(null);
          expect(result.lastCommitTimestamp).not.toEqual('');
          expect(response.statusCode).toEqual(200);
          callback(result);
        }
      );
    } else if (type === 'set') {
      request.put(
        {
          url: endpoint + '/api/set/' + id + '/timestamp',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(element)
        },
        function(error, response) {
          expect(response).toBeDefined();
          let result = JSON.parse(response.body);
          expect(result.status).toEqual('OK');
          expect(result.cont).toEqual(value);
          expect(result.lastCommitTimestamp).not.toEqual(null);
          expect(result.lastCommitTimestamp).not.toEqual('');
          expect(response.statusCode).toEqual(200);
          callback(result);
        }
      );
    }
  }

  static checkPut(type, id, element, callback) {
    if (type === 'counter') {
      request.put(
        {
          url: endpoint + '/api/count/' + id,
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(element)
        },
        function(error, response) {
          expect(response).toBeDefined();
          let result = JSON.parse(response.body);
          expect(result.status).toEqual('OK');
          expect(response.statusCode).toEqual(200);
          callback(result);
        }
      );
    } else if (type === 'set') {
      request.put(
        {
          url: endpoint + '/api/set/' + id,
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(element)
        },
        function(error, response) {
          expect(response).toBeDefined();
          let result = JSON.parse(response.body);
          expect(result.status).toEqual('OK');
          expect(response.statusCode).toEqual(200);
          callback(result);
        }
      );
    }
  }

  static checkDel(type, id, element, callback) {
    if (type === 'counter') {
      request.delete(
        {
          url: endpoint + '/api/count/' + id,
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(element)
        },
        function(error, response) {
          expect(response).toBeDefined();
          let result = JSON.parse(response.body);
          expect(result.status).toEqual('OK');
          callback(result);
        }
      );
    } else if (type === 'set') {
      request.delete(
        {
          url: endpoint + '/api/set/' + id,
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(element)
        },
        function(error, response) {
          expect(response).toBeDefined();
          let result = JSON.parse(response.body);
          expect(result.status).toEqual('OK');
          callback(result);
        }
      );
    }
  }

  static checkSync(type, id, element, callback) {
    if (type === 'counter') {
      request.put(
        {
          url: endpoint + '/api/count_sync/' + id,
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(element)
        },
        function(error, response) {
          expect(response).toBeDefined();
          let result = JSON.parse(response.body);
          expect(result.status).toEqual('OK');
          expect(response.statusCode).toEqual(200);
          callback(result);
        }
      );
    } else if (type === 'set') {
      request.put(
        {
          url: endpoint + '/api/set_sync/' + id,
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(element)
        },
        function(error, response) {
          expect(response).toBeDefined();
          let result = JSON.parse(response.body);
          expect(result.status).toEqual('OK');
          expect(response.statusCode).toEqual(200);
          callback(result);
        }
      );
    }
  }
}

if (typeof module === 'object' && module.exports) {
  module.exports = TestHelper;
}
