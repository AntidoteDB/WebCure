var SetCRDT = require('../../js/CRDTs/SetCRDT.js');

describe('SetCRDT', function() {
  it('Check the initialization of a SetCRDT Class', function() {
    var a = new SetCRDT('a', ['a', 'b', 'c']);
    var b = new SetCRDT('b');

    expect(a.id).toEqual('a');
    expect(a.state).toEqual(new Set(['a', 'b', 'c']));
    expect(a.type).toEqual('set');
    expect(b.state).toEqual(new Set([]));

    expect(a.operations).toEqual([]);
    expect(a.sentOperations).toEqual([]);
  });

  it('Add an element to a set', function() {
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
    expect(a.materialize()).toEqual(['a']);
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
    expect(b.materialize()).toEqual(['a']);
  });

  it('Remove an element from a Set', function() {
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
    expect(a.materialize()).toEqual([]);
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
    expect(b.materialize()).toEqual([]);
  });
});
