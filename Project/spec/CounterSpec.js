const request = require('request');
const endpoint = 'http://localhost:3001';

describe('Counter', function() {
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
});
