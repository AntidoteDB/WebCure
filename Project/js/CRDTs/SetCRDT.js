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
}
