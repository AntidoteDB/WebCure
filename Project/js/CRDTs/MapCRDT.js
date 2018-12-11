/* eslint-disable no-unused-vars */
class MapCRDT {
  /* eslint-enable  no-unused-vars */
  constructor(id, values) {
    this.id = id;
    this.state = values ? values : [];
    this.type = 'map';
    this.operations = [];
    this.sentOperations = [];
  }

  calculateState() {
    let values = [];

    if (this.sentOperations.length > 0) {
      this.sentOperations.forEach(operation => {
        if (operation.type === 'assign') {
          this.state = [operation.value];
        } else if (operation.type === 'reset') {
          this.state = [];
        }
      });
    }

    if (this.operations.length > 0) {
      this.operations.forEach(operation => {
        if (operation.type === 'assign') {
          this.state = [operation.value];
        } else if (operation.type === 'reset') {
          this.state = [];
        }
      });
    }

    this.state.forEach(key => {
      values.push(key);
    });

    return values;
  }

  processSentOperations() {
    if (this.operations.length > 0) {
      this.operations.forEach(operation => {
        this.sentOperations.push(operation);
      });
      this.operations = [];
    }
  }

  update(valueToAssign) {
    let operation = {
      type: 'assign',
      value: valueToAssign
    };

    this.operations.push(operation);
  }

  remove(valueToAssign) {
    let operation = {
      type: 'assign',
      value: valueToAssign
    };

    this.operations.push(operation);
  }

  reset() {
    let operation = {
      type: 'reset'
    };

    this.operations.push(operation);
  }

}

/* istanbul ignore if  */
if (typeof module === 'object' && module.exports) {
  module.exports = MapCRDT;
}
