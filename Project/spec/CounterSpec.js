const request = require('request');
var CounterCRDT = require('../js/CRDTs/CounterCRDT.js');
const endpoint = 'http://localhost:3001';
var cmd = require('node-cmd');

describe('Counter', function() {
  var stopDocker = function(callback) {
    console.log('##################### Stopping docker-container ...');
    cmd.get('docker-compose kill', function() {
      console.log('##################### Docker-container stopped ...');
      callback();
    });
  };

  var runDocker = function(callback) {
    console.log('##################### Restarting docker-container ...');
    cmd.run('docker-compose up');
    setTimeout(function() {
      console.log('##################### Docker-container restarted ...');
      callback();
    }, 5000);
  };

  // Restart the docker-container in order to erase the AntidoteDB of old values
  beforeEach(function(done) {
    stopDocker(function() {
      runDocker(done);
    });
  });

  it('Should check the get request for the counter and initial value of 0', function(done) {
    request.get(endpoint + '/api/count/a', function(error, response) {
      expect(response).toBeDefined();
      let result = JSON.parse(response.body);
      expect(result.status).toEqual('OK');
      expect(result.cont).toEqual(0);
      expect(result.lastCommitTimestamp).not.toEqual(null);
      expect(result.lastCommitTimestamp).not.toEqual('');
      expect(response.statusCode).toEqual(200);

      done();
    });
  });

  it('Incrementing the value', function(done) {
    request.put(endpoint + '/api/count/a', function(error, response) {
      expect(response).toBeDefined();
      let result = JSON.parse(response.body);
      expect(result.status).toEqual('OK');

      request.get(endpoint + '/api/count/a', function(error, response) {
        expect(response).toBeDefined();
        let result = JSON.parse(response.body);
        expect(result.status).toEqual('OK');
        expect(result.cont).toEqual(1);
        expect(result.lastCommitTimestamp).not.toEqual(null);
        expect(result.lastCommitTimestamp).not.toEqual('');
        expect(response.statusCode).toEqual(200);

        done();
      });
    });
  });

  it('Decrementing the value', function(done) {
    request.del(endpoint + '/api/count/a', function(error, response) {
      expect(response).toBeDefined();
      let result = JSON.parse(response.body);
      expect(result.status).toEqual('OK');

      request.get(endpoint + '/api/count/a', function(error, response) {
        expect(response).toBeDefined();

        let result = JSON.parse(response.body);
        expect(result.status).toEqual('OK');
        expect(result.cont).toEqual(-1);
        expect(result.lastCommitTimestamp).not.toEqual(null);
        expect(result.lastCommitTimestamp).not.toEqual('');
        expect(response.statusCode).toEqual(200);

        done();
      });
    });
  });

  // Stop the docker-container after the test;
  afterEach(function(done) {
    stopDocker(done);
  });
});
