const request = require('request');
const endpoint = 'http://localhost:3001';

describe('Counter', function() {
  it('should return 200 response code', function(done) {
    request.get(endpoint, function(error, response) {
      console.log('Response StatusCode: ', response.statusCode);
      expect(response.statusCode).toEqual(200);
      done();
    });
  });
});
