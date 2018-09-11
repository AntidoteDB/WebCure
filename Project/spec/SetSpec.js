const request = require('request');
const endpoint = 'http://localhost:3001';
var cmd = require('node-cmd');

describe('Set', function() {
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

  it('Should check the get request for the set and initial value of [ ]', function(done) {
    request.get(endpoint + '/api/set/b', function(error, response) {
      expect(response).toBeDefined();
      let result = JSON.parse(response.body);
      expect(result.status).toEqual('OK');
      expect(result.cont).toEqual([]);
      expect(result.lastCommitTimestamp).not.toEqual(null);
      expect(result.lastCommitTimestamp).not.toEqual('');
      expect(response.statusCode).toEqual(200);
      done();
    });
  });

  it('Adding and removing the value from the set', function(done) {
    request.put(
      {
        url: endpoint + '/api/set/b',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          value: 'a'
        })
      },
      function(error, response) {
        expect(response).toBeDefined();
        let result = JSON.parse(response.body);
        expect(result.status).toEqual('OK');
        request.get(endpoint + '/api/set/b', function(error, response) {
          expect(response).toBeDefined();
          let result = JSON.parse(response.body);
          expect(result.status).toEqual('OK');
          expect(result.cont).toEqual(['a']);
          expect(result.lastCommitTimestamp).not.toEqual(null);
          expect(result.lastCommitTimestamp).not.toEqual('');
          expect(response.statusCode).toEqual(200);

          request.delete(
            {
              url: endpoint + '/api/set/b',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                value: 'a'
              })
            },
            function(error, response) {
              expect(response).toBeDefined();
              let result = JSON.parse(response.body);
              expect(result.status).toEqual('OK');
              request.get(endpoint + '/api/set/b', function(error, response) {
                expect(response).toBeDefined();
                let result = JSON.parse(response.body);
                expect(result.status).toEqual('OK');
                expect(result.cont).toEqual([]);
                expect(result.lastCommitTimestamp).not.toEqual(null);
                expect(result.lastCommitTimestamp).not.toEqual('');
                expect(response.statusCode).toEqual(200);
                done();
              });
            }
          );
        });
      }
    );
  });

  // Stop the docker-container after the test;
  afterEach(function(done) {
    stopDocker(done);
  });
});
