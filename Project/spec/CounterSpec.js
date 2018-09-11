const request = require('request');
const endpoint = 'http://localhost:3001';
var cmd = require('node-cmd');

describe('Counter', function() {
  var stopDocker = function(callback) {
    console.log('##################### Stopping docker-container ...');
    cmd.get('docker rm antidoteClientProject -f', function() {
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
    }, 15000);
  };

  // Restart the docker-container in order to erase the AntidoteDB of old values
  beforeEach(function(done) {
    stopDocker(function() {
      runDocker(done);
    });
  });

  it('Should check the get request for the counter and initial value of 0 [a]', function(done) {
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

  it('Incrementing the value [b]', function(done) {
    request.put(endpoint + '/api/count/b', function(error, response) {
      expect(response).toBeDefined();
      let result = JSON.parse(response.body);
      expect(result.status).toEqual('OK');

      request.get(endpoint + '/api/count/b', function(error, response) {
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

  it('Decrementing the value [c]', function(done) {
    request.delete(endpoint + '/api/count/c', function(error, response) {
      expect(response).toBeDefined();
      let result = JSON.parse(response.body);
      expect(result.status).toEqual('OK');

      request.get(endpoint + '/api/count/c', function(error, response) {
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
