var ADS7828 = function(i2cSlave) {
  this.i2cSlave = i2cSlave;
}

ADS7828.prototype = {
  init: function() {
    return new Promise(function(resolve, reject) {
      resolve();
    });
  },
  read: function(registerAddress) {
    var self = this;
    return new Promise(function(resolve, reject) {
      self.i2cSlave.read16(registerAddress)
      .then(function(rawData) {
        var high = (rawData << 8) & 0xffff;
        var low = rawData >> 8 & 0xffff;
        var value = high + low;
        resolve(value);
      }, function(reason) {
        reject(reason);
      });
    });
  }
}
