var CounterCRDT = require('../js/CRDTs/CounterCRDT.js');
var TestHelper = require('./TestHelper');
const type = 'counter';

describe('Counter Offline', function() {
  it('Get counter, save locally, increment it and then check that the counter by previous timestamp is still the same', function(done) {
    const key = 'counter_offline1';
    let timestamp;
    let item;

    TestHelper.checkGet(type, key, 0, function(result) {
      item = new CounterCRDT(key, result.cont);
      timestamp = result.lastCommitTimestamp;
      TestHelper.checkPut(type, key, {}, function() {
        TestHelper.checkGet(type, key, 1, function() {
          TestHelper.checkPut(
            type,
            key + '/timestamp',
            {
              timestamp: { data: timestamp },
              update_clock: false
            },
            function(result) {
              expect(result.cont).toEqual(item.state);
              expect(result.lastCommitTimestamp).toEqual(timestamp);
              done();
            }
          );
        });
      });
    });
  });

  it('Get counter, increment and check changes, check the value by old timestamp, apply some changes on that one, check lastest changes [h]', function(done) {
    let timestamp, newTimestamp;
    let item;
    const key = 'counter_offline2';

    TestHelper.checkGet(type, key, 0, function(result) {
      item = new CounterCRDT(key, result.cont);
      timestamp = result.lastCommitTimestamp;

      TestHelper.checkPut(type, key, {}, function() {
        TestHelper.checkGet(type, key, 1, function() {
          TestHelper.checkPut(
            type,
            key + '/timestamp',
            {
              timestamp: { data: timestamp },
              update_clock: false
            },
            function(result) {
              expect(result.cont).toEqual(item.state);
              expect(result.lastCommitTimestamp).toEqual(timestamp);
              TestHelper.checkPut(type, key, { lastCommitTimestamp: { data: timestamp } }, function(
                result
              ) {
                newTimestamp = result.lastCommitTimestamp;
                TestHelper.checkPut(
                  type,
                  key + '/timestamp',
                  { timestamp: { data: timestamp }, update_clock: false },
                  function(result) {
                    expect(result.cont).toEqual(item.state);
                    expect(result.lastCommitTimestamp).toEqual(timestamp);
                    TestHelper.checkPut(
                      type,
                      key + '/timestamp',
                      { timestamp: { data: newTimestamp }, update_clock: false },
                      function(result) {
                        expect(result.lastCommitTimestamp).toEqual(newTimestamp);
                        TestHelper.checkGet(type, key, 2, done);
                      }
                    );
                  }
                );
              });
            }
          );
        });
      });
    });
  });

  it('Get counter, decrement and check changes, check the value by old timestamp, apply some changes on that one, check lastest changes [k]', function(done) {
    const key = 'counter_offline3';
    let timestamp, newTimestamp;
    let item;

    TestHelper.checkGet(type, key, 0, function(result) {
      item = new CounterCRDT(key, result.cont);
      timestamp = result.lastCommitTimestamp;

      TestHelper.checkDel(type, key, {}, function() {
        TestHelper.checkGet(type, key, -1, function() {
          TestHelper.checkPut(
            type,
            key + '/timestamp',
            {
              timestamp: { data: timestamp },
              update_clock: false
            },
            function(result) {
              expect(result.cont).toEqual(item.state);
              expect(result.lastCommitTimestamp).toEqual(timestamp);
              TestHelper.checkDel(type, key, { lastCommitTimestamp: { data: timestamp } }, function(
                result
              ) {
                newTimestamp = result.lastCommitTimestamp;
                TestHelper.checkPut(
                  type,
                  key + '/timestamp',
                  { timestamp: { data: timestamp }, update_clock: false },
                  function(result) {
                    expect(result.cont).toEqual(item.state);
                    expect(result.lastCommitTimestamp).toEqual(timestamp);
                    TestHelper.checkPut(
                      type,
                      key + '/timestamp',
                      { timestamp: { data: newTimestamp }, update_clock: false },
                      function(result) {
                        expect(result.lastCommitTimestamp).toEqual(newTimestamp);
                        TestHelper.checkGet(type, key, -2, done);
                      }
                    );
                  }
                );
              });
            }
          );
        });
      });
    });
  });
});
