class crdt_counter {
    constructor() {
        this.initialState = 0;
    }

    downstream(operation, uid, state) {
        if (operation.name === "increment") {
            return 1;
        } else {
            return -1;
        }
    }

    update(downstream, state) {
        return state + downstream;
    }

    value(state) {
        return state.toString();
    }

    defaultOperation() {
        return "increment";
    }

    operationSuggestions() {
        return ["increment", "decrement"];
    }

    checkOperation(operation) {
        if (operation.name != "increment" && operation.name != "decrement") {
            return "Unsupported operation: " + operation.name;
        }
        if (operation.args.length != 0) {
            return "No arguments expected";
        }
        return null;
    }

    stateToString(state) {
        return state.toString();
    }

    downstreamToString(downstream) {
        return downstream.toString();
    }
}