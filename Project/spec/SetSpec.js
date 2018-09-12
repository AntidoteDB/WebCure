var TestHelper = require('./TestHelper');
const type = 'set';

describe('Set', function() {
  it('Should check the get request for the set and initial value of [ ], [d]', function(done) {
    TestHelper.checkGet(type, 'd', [], done);
  });

  it('Adding and removing the value from the set [e]', function(done) {
    const key = 'e';
    TestHelper.checkPut(type, key, { value: 'a' }, function() {
      TestHelper.checkGet(type, key, ['a'], function() {
        TestHelper.checkDel(type, key, { value: 'a' }, function() {
          TestHelper.checkGet(type, key, [], done);
        });
      });
    });
  });
});
