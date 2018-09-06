var SetCRDT = require('../js/CRDTs/SetCRDT.js');

describe('SetCRDT', function() {
  it('Check the initialization of a set CRDT Class', function() {
    var a = new SetCRDT('a', ['a', 'b', 'c']);
    var b = new SetCRDT('b');

    expect(a.id).toEqual('a');
    expect(a.state).toEqual(new Set(['a', 'b', 'c']));
    expect(a.type).toEqual('set');
    expect(b.state).toEqual(new Set([]));

    expect(a.operations).toEqual([]);
    expect(a.sentOperations).toEqual([]);
  });

  it('Increment the Counter by value', function() {
    var a = new SetCRDT('a');
    var b = new SetCRDT('b');
    expect(a.state).toEqual(new Set([]));
    a.add('a');
    expect(a.operations).toEqual([
      {
        type: 'add',
        value: 'a'
      }
    ]);
    expect(a.sentOperations).toEqual([]);
    expect(a.state).toEqual(new Set([]));
    expect(a.calculateState()).toEqual(['a']);
    a.processSentOperations();
    expect(a.operations).toEqual([]);
    expect(a.sentOperations).toEqual([
      {
        type: 'add',
        value: 'a'
      }
    ]);
    expect(a.state).toEqual(new Set(['a']));

    expect(b.state).toEqual(new Set([]));
    b.add('a');
    b.processSentOperations();
    expect(b.calculateState()).toEqual(['a']);
  });

  it('Decrement the Counter by value', function() {
    var a = new SetCRDT('a', ['a']);
    var b = new SetCRDT('b', ['a']);
    expect(a.state).toEqual(new Set(['a']));
    a.remove('a');
    expect(a.operations).toEqual([
      {
        type: 'remove',
        value: 'a'
      }
    ]);
    expect(a.sentOperations).toEqual([]);
    expect(a.state).toEqual(new Set(['a']));
    expect(a.calculateState()).toEqual([]);
    a.processSentOperations();
    expect(a.operations).toEqual([]);
    expect(a.sentOperations).toEqual([
      {
        type: 'remove',
        value: 'a'
      }
    ]);
    expect(a.state).toEqual(new Set([]));

    expect(b.state).toEqual(new Set(['a']));
    b.remove('a');
    b.processSentOperations();
    expect(b.calculateState()).toEqual([]);
  });
});
