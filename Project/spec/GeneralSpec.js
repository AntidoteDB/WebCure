var TestHelper = require('./TestHelper');

describe('General', function() {
  it('should return 200 response code', function(done) {
    TestHelper.checkAppAvailability(done);
  });
});
