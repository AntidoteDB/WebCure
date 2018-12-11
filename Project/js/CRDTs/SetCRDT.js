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

  processSentOperations() {
    if (this.operations.length > 0) {
      this.operations.forEach(operation => {
        this.sentOperations.push(operation);
      });
      this.operations = [];
    }
  }

  calculateState() {
    let values = [];

    if (this.sentOperations.length > 0) {
      this.sentOperations.forEach(operation => {
        if (operation.type === 'add') {
          this.state.add(operation.value);
        } else if (operation.type === 'remove') {
          this.state.delete(operation.value);
        }
      });
    }

    if (this.operations.length > 0) {
      this.operations.forEach(operation => {
        if (operation.type === 'add') {
          this.state.add(operation.value);
        } else if (operation.type === 'remove') {
          this.state.delete(operation.value);
        }
      });
    }

    this.state.forEach(key => {
      values.push(key);
    });

    return values;
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

/* istanbul ignore if  */
if (typeof module === 'object' && module.exports) {
  module.exports = SetCRDT;
}
