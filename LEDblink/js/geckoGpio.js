'use strict';

navigator.requestGPIOAccess = function() {
  return new Promise(function(resolve, reject) {
    if (!navigator.mozGpio) {
      navigator.mozGpio = new Object();
      navigator.mozGpio.export = function(portno) {
      };
      navigator.mozGpio.unexport = function(portno) {
      };
      navigator.mozGpio.setValue = function(portno, value) {
        console.log('setValue(' + portno + ',' + value + ')');
      };
      navigator.mozGpio.getValue = function(portno) {
        return portno;
      };
      navigator.mozGpio.setDirection = function(portno, direction) {
        console.log('setDirection(' + portno + ',' + direction + ')');
      };
      navigator.mozGpio.getDirection = function() {
        return 'out';
      };
    }

    var gpioAccess = new GPIOAccess();
    resolve(gpioAccess);
  });
};

function GPIOAccess() {
  this.init();
}

GPIOAccess.prototype = {
  init: function() {
    this.ports = new Map();

    navigator.mozGpio.export(163);  //PWM
    navigator.mozGpio.export(192);  //UART
    navigator.mozGpio.export(193);  //UART
    navigator.mozGpio.export(196);  //SPI
    navigator.mozGpio.export(197);  //SPI
    navigator.mozGpio.export(198);  //SPI
    navigator.mozGpio.export(199);  //SPI
    navigator.mozGpio.export(243);  //SPI
    navigator.mozGpio.export(244);  //SPI
    navigator.mozGpio.export(245);  //SPI
    navigator.mozGpio.export(246);  //SPI
    navigator.mozGpio.export(252);  //I2C
    navigator.mozGpio.export(253);  //I2C
    navigator.mozGpio.export(256);  //I2C
    navigator.mozGpio.export(257);  //I2C
    navigator.mozGpio.export(283);  //UART
    navigator.mozGpio.export(284);  //UART
    navigator.mozGpio.export(353);  //GPIO

    this.ports.set(163 - 0, new GPIOPort(163));
    this.ports.set(192 - 0, new GPIOPort(192));
    this.ports.set(193 - 0, new GPIOPort(193));
    this.ports.set(196 - 0, new GPIOPort(196));
    this.ports.set(197 - 0, new GPIOPort(197));
    this.ports.set(198 - 0, new GPIOPort(198));
    this.ports.set(199 - 0, new GPIOPort(199));
    this.ports.set(243 - 0, new GPIOPort(243));
    this.ports.set(244 - 0, new GPIOPort(244));
    this.ports.set(245 - 0, new GPIOPort(245));
    this.ports.set(246 - 0, new GPIOPort(246));
    this.ports.set(252 - 0, new GPIOPort(252));
    this.ports.set(253 - 0, new GPIOPort(253));
    this.ports.set(256 - 0, new GPIOPort(256));
    this.ports.set(257 - 0, new GPIOPort(257));
    this.ports.set(283 - 0, new GPIOPort(283));
    this.ports.set(284 - 0, new GPIOPort(284));
    this.ports.set(353 - 0, new GPIOPort(353));
    console.log('size=' + this.ports.size);
  }
};

function GPIOPort(portNumber) {
  this.init(portNumber);
}

GPIOPort.prototype = {
  init: function(portNumber) {
    this.portNumber = portNumber;
    this.direction = 'out';
    this.interval = 30;
    this.value = null;
    this.timer = null;
  },

  setDirection: function(direction) {
    return new Promise(function(resolve, reject) {
      if (direction === 'in' || direction === 'out') {
        this.direction = direction;
        navigator.mozGpio.setDirection(this.portNumber, direction === 'out');
        if(direction === "in"){
          console.log("in");
          var self = this;
          this.timer = setInterval(this.checkValue,this.interval,self);
        }else{
          console.log("out");
          if(this.timer){
            clearInterval(this.timer);            
          }
          console.log("time");
        }
        resolve();
      } else {
        reject({'message':'invalid direction'});
      }
    }.bind(this));
  },

  isInput: function() {
    return this.direction === 'in';
  },

  read: function() {
    return new Promise(function(resolve, reject) {
      if (this.isInput()) {
        resolve(navigator.mozGpio.getValue(this.portNumber));
      } else {
        reject({'message':'invalid direction'});
      }
    }.bind(this));
  },

  write: function(value) {
    return new Promise(function(resolve, reject) {
      if (this.isInput()) {
        reject({'message':'invalid direction'});
      } else {
        navigator.mozGpio.setValue(this.portNumber, value);
        resolve(value);
      }
    }.bind(this));
  },
  
  checkValue:function(port){
    port.read().then(
      function(value){
        if(port.value != null){
          if(parseInt(value) != parseInt(port.value)){
            if(typeof(port.onchange) === "function"){
              port.onchange(value);  
            }else{
              console.log("port.onchange is not a function.");
            }
          }        
        }
        port.value = value;
      },
      function(){
        console.log("check value error");
      }
    );
  },
  onchange:null
};

navigator.setGpioPort = function(portno,dist){
  
  return new Promise(function(resolve, reject){
    navigator.requestGPIOAccess().then(
      function(gpioAccess){
        console.log("gpioAccess" + portno);
        var port = gpioAccess.ports.get(portno);
        port.setDirection(dist).then(
          function(){
            console.log('export OK');
            resolve(port);
          },
          function() {
            console.log('export NG'); 
            reject();
          }
        );
      }
    );
  });
};