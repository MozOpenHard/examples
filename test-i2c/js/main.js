'use strict';

navigator.requestI2CAccess = function() {
  return new Promise(function(resolve, reject) {
    if (navigator.mozI2c) {
      var i2cAccess = new I2CAccess()
      resolve(i2cAccess);
    } else {
      reject({'message':'mozI2c not supported'});
    }
  });
}

function I2CAccess() {
  this.init();
}

I2CAccess.prototype = {
  init: function() {
    this.ports = new Map();

    navigator.mozI2c.open(0, 0x3e);
    navigator.mozI2c.open(2, 0x3e);

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

window.addEventListener('load', function (){
  function Sleep(millisec) {
    var start = new Date();
    while(new Date() - start < millisec);
  }

  navigator.requestI2CAccess().then(
    function(i2cAccess) {
      var ports = i2cAccess.ports;
      var port = ports.get(2);
      // init
      var LCD_CONTRAST = 100;
      Sleep(40);
      port.write8(0x00, 0x38);
      Sleep(1);
      port.write8(0x00, 0x39);
      Sleep(1);
      port.write8(0x00, 0x14);
      Sleep(1);
      port.write8(0x00, 0x70 | (LCD_CONTRAST & 0xF));
      Sleep(1);
      port.write8(0x00, 0x5c | ((LCD_CONTRAST >> 4) & 0x3));
      port.write8(0x00, 0x6c);
      Sleep(300);
      port.write8(0x00, 0x38);
      port.write8(0x00, 0x0c);
      port.write8(0x00, 0x01);
      port.write8(0x00, 0x06);
      Sleep(2);

      document.getElementById('contrast').addEventListener('change', function() {
        console.log(this.value);
        port.write8(0x00, 0x39);
        Sleep(1);
        port.write8(0x00, 0x70 | (this.value & 0x0f));
        Sleep(1);
        port.write8(0x00, 0x38);
      }, false);

      var row0 = document.getElementById('row0');
      var row1 = document.getElementById('row1');
      var submitButton = document.getElementById('submitButton');
      submitButton.addEventListener('click', function (){
        var i;

        port.write8(0x00, 0x80 | 0x00);
        for (i = 0; i < row0.value.length; i++) {
          port.write8(0x40, row0.value.charCodeAt(i));
        }

        port.write8(0x00, 0x80 | 0x40);
        for (i = 0; i < row1.value.length; i++) {
          port.write8(0x40, row1.value.charCodeAt(i));
        }
      }, false);
    },
    function(error) {
      console.log(error.message);
    }
  );
}, false);
