const request = require('request');
var SetCRDT = require('../js/CRDTs/SetCRDT.js');
const endpoint = 'http://localhost:3001';

describe('Set Offline', function() {
  it('Get set, save locally, add some elements into it and then check that the set by previous timestamp is still the same [g]', function(done) {
    let timestamp;
    let item;

    request.get(endpoint + '/api/set/g', function(error, response) {
      let result = JSON.parse(response.body);
      expect(result.cont).toEqual([]);
      item = new SetCRDT('g', result.cont);
      timestamp = result.lastCommitTimestamp;

      expect(timestamp).not.toEqual(null);
      expect(timestamp).not.toEqual('');
      expect(response.statusCode).toEqual(200);

      request.put(
        {
          url: endpoint + '/api/set/g',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            value: 'a'
          })
        },
        function(error, response) {
          let result = JSON.parse(response.body);
          expect(result.status).toEqual('OK');

          request.get(endpoint + '/api/set/g', function(error, response) {
            expect(response).toBeDefined();
            let result = JSON.parse(response.body);
            expect(result.status).toEqual('OK');
            expect(result.cont).toEqual(['a']);
            expect(result.lastCommitTimestamp).not.toEqual(null);
            expect(result.lastCommitTimestamp).not.toEqual('');
            expect(response.statusCode).toEqual(200);

            request.put(
              {
                url: endpoint + '/api/set/g/timestamp',
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
                expect(result.cont).toEqual(item.calculateState());
                expect(result.lastCommitTimestamp).toEqual(timestamp);
                expect(response.statusCode).toEqual(200);

                done();
              }
            );
          });
        }
      );
    });
  });
});
