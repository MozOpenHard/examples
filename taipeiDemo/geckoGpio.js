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

    navigator.mozGpio.export(198);
    navigator.mozGpio.export(199);

    this.ports.set(198 - 0, new GPIOPort(198));
    this.ports.set(199 - 0, new GPIOPort(199));
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
  },

  setDirection: function(direction) {
    return new Promise(function(resolve, reject) {
      if (direction === 'in' || direction === 'out') {
        this.direction = direction;
        navigator.mozGpio.setDirection(this.portNumber, direction === 'out');
        if(direction === "in"){
          console.log("in");
          var self = this;
          _Timer[this.portNumber] = setInterval(_checkValue,_Interval,self);
        }else{
          console.log("out");
          if(_Timer[this.portNumber]){
            clearInterval(_Timer[this.portNumber]);            
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
  
  onchange:null
};

var _Timer = {"196":null,"197":null,"198":null,"199":null};
var _Interval = 100;
var _readValue = {"196":null,"197":null,"198":null,"199":null};
function _checkValue(port){
  //console.log("checkvalue");
  port.read().then(
    function(value){
      //console.log("check value success " + value + ":" + _readValue[port.portno]);
      if(_readValue[port.portno] != null){
        if(parseInt(value) != parseInt(_readValue[port.portno])){
          console.log("onchange");
          if(typeof(port.onchange) === "function"){
            port.onchange(value);  
          }else{
            console.log("port.onchange is not a function.");
          }
        }        
      }
      _readValue[port.portno] = value;
    },
    function(){
      console.log("check value error");
    }
  );
}

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