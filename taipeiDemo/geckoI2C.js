'use strict';


navigator.requestI2CAccess = function(portno,address) {
  return new Promise(function(resolve, reject) {
    if (navigator.mozI2c) {
      var i2cAccess = new I2CAccess(portno,address);
      resolve(i2cAccess);
    } else {
      reject({'message':'mozI2c not supported'});
    }
  });
};

function I2CAccess(portno,address) {
  this.init(portno,address);
}

I2CAccess.prototype = {
  init: function(portno,address) {
    this.ports = new Map();

    //navigator.mozI2c.open(0, 0x48);
    //navigator.mozI2c.open(2, 0x3e);
    navigator.mozI2c.open(portno,address);

    this.ports.set(0 - 0, new I2CPort(0));
    this.ports.set(2 - 0, new I2CPort(2));
    console.log('size=' + this.ports.size);
  }
};

function I2CPort(portNumber) {
  this.init(portNumber);
}

I2CPort.prototype = {
  init: function(portNumber) {
    this.portNumber = portNumber;
  },

  read: function(command, isOctet) {
    return new Promise(function(resolve, reject) {
      resolve(navigator.mozI2c.read(this.portNumber, command, isOctet));
    }.bind(this));
  },

  write8: function(command, value) {
    return new Promise(function(resolve, reject) {
      navigator.mozI2c.write(this.portNumber, command, value, true);
      resolve(value);
    }.bind(this));
  },

  write16: function(command, value) {
    return new Promise(function(resolve, reject) {
      navigator.mozI2c.write(this.portNumber, command, value, false);
      resolve(value);
    }.bind(this));
  }
};


navigator.setI2cPort = function(portno,address){
  return new Promise(function(resolve, reject){
    navigator.requestI2CAccess(portno,address).then(
      function(i2cAccess){
        var port = i2cAccess.ports.get(portno);
        resolve(port);
      },
      function() {
        console.log('export NG'); 
        reject();
      }
    );
  });
};
