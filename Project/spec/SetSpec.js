const request = require('request');
const endpoint = 'http://localhost:3001';

describe('Set', function() {
  it('Should check the get request for the set and initial value of [ ], [d]', function(done) {
    request.get(endpoint + '/api/set/d', function(error, response) {
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

  it('Adding and removing the value from the set [e]', function(done) {
    request.put(
      {
        url: endpoint + '/api/set/e',
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
        request.get(endpoint + '/api/set/e', function(error, response) {
          expect(response).toBeDefined();
          let result = JSON.parse(response.body);
          expect(result.status).toEqual('OK');
          expect(result.cont).toEqual(['a']);
          expect(result.lastCommitTimestamp).not.toEqual(null);
          expect(result.lastCommitTimestamp).not.toEqual('');
          expect(response.statusCode).toEqual(200);

          request.delete(
            {
              url: endpoint + '/api/set/e',
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
              request.get(endpoint + '/api/set/e', function(error, response) {
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
});
