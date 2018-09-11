const request = require('request');
var CounterCRDT = require('../js/CRDTs/CounterCRDT.js');
const endpoint = 'http://localhost:3001';

describe('Counter Offline', function() {
  it('Get counter, save locally, increment it and then check that the counter by previous timestamp is still the same [f]', function(done) {
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
});
