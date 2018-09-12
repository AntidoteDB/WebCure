var TestHelper = require('./TestHelper');
const type = 'counter';

describe('Counter', function() {
  it('Should check the get request for the counter and initial value of 0 [a]', function(done) {
    TestHelper.checkGet(type, 'a', 0, done);
  });

  it('Incrementing the value [b]', function(done) {
    TestHelper.checkPut(type, 'b', {}, function() {
      TestHelper.checkGet(type, 'b', 1, done);
    });
  });

  it('Decrementing the value [c]', function(done) {
    TestHelper.checkDel(type, 'c', {}, function() {
      TestHelper.checkGet(type, 'c', -1, done);
    });
  });
});
