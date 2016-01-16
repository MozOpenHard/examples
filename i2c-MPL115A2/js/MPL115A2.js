var MPL115A2 = function(i2cSlave) {
  this.i2cSlave = i2cSlave;
}

MPL115A2.prototype = {
  init: function() {
    return new Promise(function(resolve, reject) {
      resolve();
    });
  },

  sleep: function(ms, generator) {
    return new Promise(function(resolve, reject) {
      setTimeout(function(){
        resolve();
      }, ms);
    });
  },

  getValue: function(registerAddress) {
    return this.i2cSlave.read8(registerAddress);
  },

  read: function() {
    var self = this;
    return new Promise(function(resolve, reject) {
      self.i2cSlave.write8(0x12, 0x01)
      .then(function() {
        return self.sleep(10);
      })
      .then(function() {
        return Promise.all([
          self.getValue(0x00),
          self.getValue(0x01),
          self.getValue(0x02),
          self.getValue(0x03)
        ]);
      })
      .then(function(values) {
        var ph = values[0];
        var pl = values[1];
        var pressure = ((ph * 256) + pl)/64;
        var th = values[2];
        var tl = values[3];
        var temperature = ((th * 256) + tl)/64;
        resolve([pressure, temperature]);
      }).catch (function(reason) {
        reject(reason);
      });
    });
  }
}
