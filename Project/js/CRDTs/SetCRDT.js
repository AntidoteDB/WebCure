/* eslint-disable no-unused-vars */
class SetCRDT {
  /* eslint-enable  no-unused-vars */
  constructor(id, values) {
    this.id = id;
    this.state = values ? new Set(values) : new Set();
    this.type = 'set';
    this.operations = [];
    this.sentOperations = [];
  }

  add(valueToAdd) {
    let operation = {
      type: 'add',
      value: valueToAdd
    };

    this.operations.push(operation);
  }

  remove(valueToRemove) {
    let operation = {
      type: 'remove',
      value: valueToRemove
    };

    this.operations.push(operation);
  }
}
