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

  calculateState() {
    if (this.sentOperations.length > 0) {
      this.sentOperations.forEach(operation => {
        this.state += operation;
      });
    }

    if (this.operations.length > 0) {
      this.operations.forEach(operation => {
        this.state += operation;
      });
    }

    return this.state;
  }

  processSentOperations() {
    if (this.operations.length > 0) {
      this.operations.forEach(operation => {
        this.sentOperations.push(operation);
      });
      this.operations = [];
    }
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
