'use strict';

navigator.requestOneI2CAccess = function( i2cPortNumber , i2cAddress ) {
  return new Promise(function(resolve, reject) {
    if (navigator.mozI2c) {
      var oneI2cAccess = new oneI2CAccess( i2cPortNumber , i2cAddress )
      resolve(oneI2cAccess);
    } else {
      reject({'message':'mozI2c not supported'});
    }
  });
}

function oneI2CAccess( i2cPortNumber , i2cAddress ) {
  this.init( i2cPortNumber , i2cAddress );
}

oneI2CAccess.prototype = {
  init: function( i2cPortNumber , i2cAddress ) {
    this.port = null;
    navigator.mozI2c.open(i2cPortNumber , i2cAddress );
    this.port = new I2CPort(i2cPortNumber);
  }
};

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

    navigator.mozI2c.open(0, 0x40);
//    navigator.mozI2c.open(2, 0x3e);

    this.ports.set(0 - 0, new I2CPort(0));
//    this.ports.set(2 - 0, new I2CPort(2));
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
  
  function initPCA4servo( port , noSetZero ){
    // init phase 1 (normal mode)
    Sleep(40);
    port.write8(0x00, 0x00); // set normal MODE1 registar
    Sleep(10);
    port.write8(0x01, 0x04); // set normal MODE2 registar
    Sleep(10);

    // init phase 2 (pre-scaler to 61Hz)
    port.write8(0x00, 0x10); // set sleep mode(osc off)
    Sleep(10);
    port.write8(0xfe, 0x64); // 61Hz = ( 25000000 / 4096 / 61 )
    Sleep(10);
    port.write8(0x00, 0x00); // osc on
    Sleep(10);
    port.write8(0x06, 0x00); // on time L 0
    Sleep(10);
    port.write8(0x07, 0x00); // on time H 0
    Sleep(300);
    
    if ( !noSetZero ){
      for ( var servoPort = 0 ; servoPort < 16 ; servoPort ++ ){
        setServo(port , servoPort , 0 );
      }
    }
    
  }
  
  function setServo( i2cPort, servoPort, angle ){
    var portStart = 8;
    var portInterval = 4;
    
    var center = 0.001500; // sec ( 1500 micro sec)
    var range  = 0.000600; // sec ( 600 micro sec) a bit large?
    var angleRange = 50.0;
    
    if ( angle > angleRange){
      angle = angleRange;
    } else if ( angle < -angleRange ){
      angle = - angleRange;
    }
        
    var freq = 61; // Hz
    var tickSec = ( 1 / freq ) / 4096; // 1bit resolution( sec )
    var centerTick = center / tickSec;
    var rangeTick = range / tickSec;
        
    var gain = rangeTick / angleRange; // [tick / angle]
        
    var ticks = Math.round(centerTick + gain * angle);
        
    var tickH = (( ticks >> 8 ) & 0x0f);
    var tickL = (ticks & 0xff);
        
        
    i2cPort.write8( Math.round(portStart + servoPort * portInterval + 1), tickH);
    Sleep(1);
    i2cPort.write8( Math.round(portStart + servoPort * portInterval), tickL);    
  }
  
  var i2cPortNumber = 0;
  var i2cAddress = 0x40;
  
//  navigator.requestI2CAccess().then(
//    function(i2cAccess) {
//      var ports = i2cAccess.ports;
//      var port = ports.get(0);
  
  navigator.requestOneI2CAccess( i2cPortNumber, i2cAddress ).then(
    function(i2cAccess) {
      var port = i2cAccess.port;
      // init PCA9685
      initPCA4servo( port );
      
      document.getElementById('angle0').addEventListener('change', function() {
        console.log(this.value);
        var angle = Number(this.value);
        setServo(port, 0 ,angle);
        document.getElementById('angleVal0').innerHTML = "angle0:" + angle + "deg";
      }, false);

      document.getElementById('angle1').addEventListener('change', function() {
        console.log(this.value);
        var angle = Number(this.value);
        setServo(port, 1 ,angle);
        document.getElementById('angleVal1').innerHTML = "angle1:" + angle + "deg";
      }, false);
      
    },
    function(error) {
      console.log(error.message);
    }
  );
}, false);
