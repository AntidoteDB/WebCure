/* eslint-disable no-unused-vars */
class MultiValueRegisterCRDT {
  /* eslint-enable  no-unused-vars */
  constructor(id, value) {
    this.id = id;
    this.state = value ? value : 0;
    this.type = 'counter';
    this.operations = [];
    this.sentOperations = [];
  }

  calculateState() {}

  processSentOperations() {
    if (this.operations.length > 0) {
      this.operations.forEach(operation => {
        this.sentOperations.push(operation);
      });
      this.operations = [];
    }
  }
}

/* istanbul ignore if  */
if (typeof module === 'object' && module.exports) {
  module.exports = MultiValueRegisterCRDT;
}
