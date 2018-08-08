class vectorclock {
  constructor(size) {
    this.v = [];

    for (let i = 0; i < size; i++) {
      this.v.push(0);
    }
  }

  get(r) {
    return this.v[r];
  }

  with(r, n) {
    let res = new vectorclock(this.v.length);
    for (let i = 0; i < this.v.length; i++) {
      res.v[i] = this.v[i];
    }
    res.v[r] = n;
    return res;
  }

  leq(v) {
    for (let i = 0; i < this.v.length; i++) {
      if (this.v[i] > v.get(i)) {
        return false;
      }
    }
    return true;
  }

  merge(v) {
    let res = new vectorclock(this.v.length);
    for (let i = 0; i < this.v.length; i++) {
      res.v[i] = Math.max(this.get(i), v.get(i));
    }
    return res;
  }

  toString() {
    return 'VC' + this.v.toString();
  }
}
