/* eslint-disable no-unused-vars */
class CounterCRDT {
  /* eslint-enable  no-unused-vars */
  constructor(id, value) {
    this.id = id;
    this.state = value ? value : 0;
    this.type = 'counter';
    this.operations = [];
    this.sentOperations = [];
  }

  materialize() {
    this.sentOperations.forEach(operation => {
      this.state += operation;
    });

    this.operations.forEach(operation => {
      this.state += operation;
    });

    return this.state;
  }

  processSentOperations() {
    this.operations.forEach(operation => {
      this.sentOperations.push(operation);
    });
    this.operations = [];
  }

  inc(incValue) {
    let value = incValue ? incValue : 1;
    this.operations.push(value);
  }

  dec(decValue) {
    let value = decValue ? -decValue : -1;
    this.operations.push(value);
  }
}

/* istanbul ignore if  */
if (typeof module === 'object' && module.exports) {
  module.exports = CounterCRDT;
}
