var SetCRDT = require('../js/CRDTs/SetCRDT.js');
var TestHelper = require('./TestHelper');
const type = 'set';

describe('Set Offline', function() {
  it('Get set, save locally, add some elements into it and then check that the set by previous timestamp is still the same', function(done) {
    let timestamp;
    let item;
    const key = 'set_offline1';

    TestHelper.checkGet(type, key, [], function(result) {
      item = new SetCRDT(key, result.cont);
      timestamp = result.lastCommitTimestamp;
      TestHelper.checkPut(type, key, { value: 'a' }, function() {
        TestHelper.checkGet(type, key, ['a'], function() {
          TestHelper.checkPut(
            type,
            key + '/timestamp',
            {
              timestamp: { data: timestamp },
              update_clock: false
            },
            function(result) {
              expect(result.cont).toEqual(item.materialize());
              expect(result.lastCommitTimestamp).toEqual(timestamp);
              done();
            }
          );
        });
      });
    });
  });

  it('Get set, add element to it and check changes, check the value by old timestamp, apply some changes on that one, check lastest changes [h]', function(done) {
    let timestamp, newTimestamp;
    let item;
    const key = 'set_offline2';

    TestHelper.checkGet(type, key, [], function(result) {
      item = new SetCRDT(key, result.cont);
      timestamp = result.lastCommitTimestamp;

      TestHelper.checkPut(type, key, { value: 'a' }, function() {
        TestHelper.checkGet(type, key, ['a'], function() {
          TestHelper.checkPut(
            type,
            key + '/timestamp',
            {
              timestamp: { data: timestamp },
              update_clock: false
            },
            function(result) {
              expect(result.cont).toEqual(item.materialize());
              expect(result.lastCommitTimestamp).toEqual(timestamp);
              TestHelper.checkPut(
                type,
                key,
                { lastCommitTimestamp: { data: timestamp }, value: 'b' },
                function(result) {
                  newTimestamp = result.lastCommitTimestamp;
                  TestHelper.checkPut(
                    type,
                    key + '/timestamp',
                    { timestamp: { data: timestamp }, update_clock: false },
                    function(result) {
                      expect(result.cont).toEqual(item.materialize());
                      expect(result.lastCommitTimestamp).toEqual(timestamp);
                      TestHelper.checkPut(
                        type,
                        key + '/timestamp',
                        { timestamp: { data: newTimestamp }, update_clock: false },
                        function(result) {
                          expect(result.lastCommitTimestamp).toEqual(newTimestamp);
                          TestHelper.checkGet(type, key, ['a', 'b'], done);
                        }
                      );
                    }
                  );
                }
              );
            }
          );
        });
      });
    });
  });

  it('Get set, remove elements from it and check changes, check the value by old timestamp, apply some changes on that one, check lastest changes [h]', function(done) {
    let timestamp, newTimestamp;
    let item;
    const key = 'set_offline3';

    TestHelper.checkGet(type, key, [], function() {
      TestHelper.checkPut(type, key, { value: 'a' }, function() {
        TestHelper.checkPut(type, key, { value: 'b' }, function() {
          TestHelper.checkGet(type, key, ['a', 'b'], function(result) {
            item = new SetCRDT(key, result.cont);
            timestamp = result.lastCommitTimestamp;
            TestHelper.checkDel(type, key, { value: 'a' }, function() {
              TestHelper.checkGet(type, key, ['b'], function() {
                TestHelper.checkPut(
                  type,
                  key + '/timestamp',
                  {
                    timestamp: { data: timestamp },
                    update_clock: false
                  },
                  function(result) {
                    expect(result.cont).toEqual(item.materialize());
                    expect(result.lastCommitTimestamp).toEqual(timestamp);
                    TestHelper.checkDel(
                      type,
                      key,
                      { lastCommitTimestamp: { data: timestamp }, value: 'b' },
                      function(result) {
                        newTimestamp = result.lastCommitTimestamp;
                        TestHelper.checkPut(
                          type,
                          key + '/timestamp',
                          { timestamp: { data: timestamp }, update_clock: false },
                          function(result) {
                            expect(result.cont).toEqual(item.materialize());
                            expect(result.lastCommitTimestamp).toEqual(timestamp);
                            TestHelper.checkPut(
                              type,
                              key + '/timestamp',
                              { timestamp: { data: newTimestamp }, update_clock: false },
                              function(result) {
                                expect(result.lastCommitTimestamp).toEqual(newTimestamp);
                                TestHelper.checkGet(type, key, [], done);
                              }
                            );
                          }
                        );
                      }
                    );
                  }
                );
              });
            });
          });
        });
      });
    });
  });

  it('Get set, create offline operations, test sync and check that the value is the same', function(done) {
    const key = 'set_offline4';
    let timestamp;
    let item;
    TestHelper.checkGet(type, key, [], function(result) {
      item = new SetCRDT(key, result.cont);
      timestamp = result.lastCommitTimestamp;
      item.add('a');
      item.add('b');
      item.add('c');
      item.remove('a');
      TestHelper.checkSync(
        type,
        key,
        {
          lastCommitTimestamp: timestamp,
          updates: item.operations
        },
        function() {
          TestHelper.checkGet(type, key, ['b', 'c'], done);
        }
      );
    });
  });
});
