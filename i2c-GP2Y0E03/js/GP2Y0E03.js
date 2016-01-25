var GP2Y0E03 = function(i2cSlave) {
  this.i2cSlave = i2cSlave;
}

GP2Y0E03.prototype = {
  init: function() {
    return new Promise((resolve, reject) => {
      this.pow = Math.pow(2, 0x02);//0x02 is 0x35 register default value
      resolve();
    });
  },

  getValue: function(registerAddress) {
    return this.i2cSlave.read8(registerAddress);
  },

  compose: function(high, low) {
    return (high * 16 + (low & 0xf)) / 16 / this.pow;
  },

  read: function() {
    return new Promise((resolve, reject) => {
      Promise.all([
        this.getValue(0x5e),
        this.getValue(0x5f)
      ])
      .then(values => {
        var distance = this.compose(values[0], values[1]);
        resolve(distance);
      }).catch (reason => {
        reject(reason);
      });
    });
  }
}
