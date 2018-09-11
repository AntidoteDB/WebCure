var CounterCRDT = require('../js/CRDTs/CounterCRDT.js');

describe('CounterCRDT', function() {
  it('Check the initialization of a CounterCRDT Class', function() {
    var a = new CounterCRDT('a', 5);
    var b = new CounterCRDT('b');

    expect(a.id).toEqual('a');
    expect(a.state).toEqual(5);
    expect(a.type).toEqual('counter');
    expect(b.state).toEqual(0);

    expect(a.operations).toEqual([]);
    expect(a.sentOperations).toEqual([]);
  });

  it('Increment the Counter by value', function() {
    var a = new CounterCRDT('a');
    var b = new CounterCRDT('b');
    expect(a.state).toEqual(0); // a.state = 0
    a.inc(5);
    expect(a.operations).toEqual([5]); // a.operations = [5]
    expect(a.sentOperations).toEqual([]); // a.operations = []
    expect(a.state).toEqual(0); // a.state = 0
    expect(a.calculateState()).toEqual(5);
    a.processSentOperations();
    expect(a.operations).toEqual([]);
    expect(a.sentOperations).toEqual([5]);
    expect(a.state).toEqual(5);

    expect(b.state).toEqual(0);
    b.inc();
    b.processSentOperations();
    expect(b.calculateState()).toEqual(1);
    // TODO Keep in mind that at this point the sentOperationsArray is not cleared and calculateState will return 10.
  });

  it('Decrement the Counter by value', function() {
    var a = new CounterCRDT('a');
    var b = new CounterCRDT('b');
    expect(a.state).toEqual(0); // a.state = 0
    a.dec(5);
    expect(a.operations).toEqual([-5]);
    expect(a.sentOperations).toEqual([]);
    expect(a.state).toEqual(0);
    expect(a.calculateState()).toEqual(-5);
    a.processSentOperations();
    expect(a.operations).toEqual([]);
    expect(a.sentOperations).toEqual([-5]);
    expect(a.state).toEqual(-5);

    expect(b.state).toEqual(0);
    b.dec();
    b.processSentOperations();
    expect(b.calculateState()).toEqual(-1);
  });
});
