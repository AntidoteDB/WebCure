var SetCRDT = require('../js/CRDTs/SetCRDT.js');
var TestHelper = require('./TestHelper');
const type = 'set';

describe('Set Offline', function() {
  it('Get set, save locally, add some elements into it and then check that the set by previous timestamp is still the same [g]', function(done) {
    let timestamp;
    let item;
    const key = 'g';

    TestHelper.checkGet(type, key, [], function(result) {
      item = new SetCRDT(key, result.cont);
      timestamp = result.lastCommitTimestamp;
      TestHelper.checkPut(type, key, { value: 'a' }, function() {
        TestHelper.checkGet(type, key, ['a'], function() {
          TestHelper.checkPut(
            type,
            key + '/timestamp',
            {
              timestamp: timestamp
            },
            function(result) {
              expect(result.cont).toEqual(item.calculateState());
              expect(result.lastCommitTimestamp).toEqual(timestamp);
              done();
            }
          );
        });
      });
    });
  });
});
