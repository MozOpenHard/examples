var ADXL345 = function(i2cSlave) {
  this.i2cSlave = i2cSlave;
}

ADXL345.prototype = {
  sleep: function(ms, generator) {
    return new Promise(function(resolve, reject) {
      setTimeout(function(){
        resolve();
      }, ms);
    });
  },

  init: function() {
    var self = this;
    return new Promise(function(resolve, reject) {
      self.i2cSlave.write8(0x31, 0x00)
      .then(function() {
        return self.i2cSlave.write8(0x2d, 0x08);
      }).then(function() {
        resolve();
      }).catch(function(reason) {
        reject(reason);
      });
    });
  },

  getValue: function(registerAddress) {
    return this.i2cSlave.read8(registerAddress);
  },

  compose: function(high, low) {
    return (high << 8 & 0xff) + (low & 0xff);
  },

  read: function() {
    var self = this;
    return new Promise(function(resolve, reject) {
      Promise.all([
        self.getValue(0x32),
        self.getValue(0x33),
        self.getValue(0x34),
        self.getValue(0x35),
        self.getValue(0x36),
        self.getValue(0x37)
      ])
      .then(function(values) {
        var x = self.compose(values[1], values[0]);
        var y = self.compose(values[3], values[2]);
        var z = self.compose(values[5], values[4]);
        resolve([x, y, z]);
      }).catch (function(reason) {
        reject(reason);
      });
    });
  }
}
