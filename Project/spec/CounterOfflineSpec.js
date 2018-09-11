const request = require('request');
var CounterCRDT = require('../js/CRDTs/CounterCRDT.js');
const endpoint = 'http://localhost:3001';
var cmd = require('node-cmd');

describe('Counter Offline', function() {
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

  it('Get counter, save locally, increment it and then check that the counter by timestamp is still there [f]', function(done) {
    let timestamp;
    let item;

    request.get(endpoint + '/api/count/f', function(error, response) {
      let result = JSON.parse(response.body);
      expect(result.cont).toEqual(0);

      item = new CounterCRDT('f', result.cont);
      timestamp = result.lastCommitTimestamp;
      expect(timestamp).not.toEqual(null);
      expect(timestamp).not.toEqual('');
      expect(response.statusCode).toEqual(200);

      request.put(endpoint + '/api/count/f', function(error, response) {
        let result = JSON.parse(response.body);
        expect(result.status).toEqual('OK');

        request.get(endpoint + '/api/count/f', function(error, response) {
          expect(response).toBeDefined();
          let result = JSON.parse(response.body);
          expect(result.status).toEqual('OK');
          expect(result.cont).toEqual(1);
          expect(result.lastCommitTimestamp).not.toEqual(null);
          expect(result.lastCommitTimestamp).not.toEqual('');
          expect(response.statusCode).toEqual(200);

          request.put(
            {
              url: endpoint + '/api/count/f/timestamp',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                timestamp: timestamp
              })
            },
            function(error, response) {
              expect(response).toBeDefined();
              let result = JSON.parse(response.body);
              expect(result.status).toEqual('OK');
              expect(result.cont).toEqual(item.state);
              expect(result.lastCommitTimestamp).toEqual(timestamp);
              expect(response.statusCode).toEqual(200);

              done();
            }
          );
        });
      });
    });
  });

  // Stop the docker-container after the test;
  afterEach(function(done) {
    stopDocker(done);
  });
});
