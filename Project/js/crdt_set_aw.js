class crdt_set_aw {
  constructor() {
    this.initialState = new Map();
  }

  downstream(operation, uid, state) {
    if (operation.name === 'add') {
      let elem = operation.args[0];
      let tokens = state.get(elem);
      if (!tokens) {
        tokens = [];
      }
      return [
        {
          element: elem,
          addedTokens: [uid],
          removedTokens: tokens
        }
      ];
    } else if (operation.name === 'remove') {
      let elem = operation.args[0];
      let tokens = state.get(elem);
      if (!tokens) {
        tokens = [];
      }
      return [
        {
          element: elem,
          addedTokens: [],
          removedTokens: tokens
        }
      ];
    }
    throw new Error();
  }

  update(downstream, state) {
    let newState = new Map(state);
    for (let e of downstream) {
      // of gives you actual values, not indexes
      let tokens = state.get(e.element);
      if (tokens) {
        tokens = tokens.filter(x => !e.removedTokens.includes(x)).concat(e.addedTokens);
      } else {
        tokens = e.addedTokens;
      }

      if (tokens.length == 0) {
        newState.delete(e.element);
      } else {
        newState.set(e.element, tokens);
      }
    }
    return newState;
  }

  value(state) {
    let res = '{';
    state.forEach((val, key) => {
      if (res.length > 1) {
        res += ', ';
      }
      res += key;
    });
    res += '}';
    return res;
  }

  defaultOperation() {
    return 'add(x)';
  }

  operationSuggestions() {
    return ['add', 'remove'];
  }

  checkOperation(operation) {
    if (operation.name === 'add') {
      if (operation.args.length != 1) {
        return 'add only takes one argument';
      }
    } else if (operation.name === 'remove') {
      if (operation.args.length != 1) {
        return 'remove only takes one argument';
      }
    } else {
      return 'Unsupported operation: ' + operation.name;
    }
    return null;
  }

  stateToString(state) {
    let res = '{';
    state.forEach((val, key) => {
      if (res.length > 1) {
        res += ', ';
      }
      res += key + ' ' + val.toString();
    });
    res += '}';
    return res;
  }

  downstreamToString(downstream) {
    let res = '{';
    for (let e of downstream) {
      if (res.length > 1) {
        res += ', ';
      }
      res += '(' + e.element + ', ' + e.addedTokens + ', ' + e.removedTokens + ')';
    }
    res += '}';
    return res;
  }
}
