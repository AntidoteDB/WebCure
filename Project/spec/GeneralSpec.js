var TestHelper = require('./TestHelper');

describe('General', function() {
  it('should return 200 response code for the server', function(done) {
    TestHelper.checkAppAvailability(false, done);
  });

  it('should return 200 response code for the index.html', function(done) {
    TestHelper.checkAppAvailability(true, done);
  });
});
