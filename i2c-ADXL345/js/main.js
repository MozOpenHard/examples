"use strict";

var Main = {
  init: function() {
    navigator.requestI2CAccess().then(function(i2cAccess) {
      return i2cAccess.open(0);
    }).then(function(i2cPort) {
      return i2cPort.open(0x53);
    }).then(function(i2cSlave) {
      Main.adxl345 = new ADXL345(i2cSlave);
      return Main.adxl345.init();
    }).then(function() {
      Main.start();
    }).catch(function(reason) {
      console.log("ERROR:" + reason);
    });
  },

  start: function() {
    Main.read();
  },

  read: function() {
    Main.adxl345.read().then(function(values) {
      var x = values[0];
      var y = values[1];
      var z = values[2];
      console.log("x:" + x + " y:" + y + " z:" + z);
      document.getElementById("x").textContent = x;
      document.getElementById("y").textContent = y;
      document.getElementById("z").textContent = z;
      setTimeout(Main.read, 100);
    }).catch(function(reason) {
      console.log("READ ERROR:" + reason);
    });
  }
}

window.addEventListener("DOMContentLoaded", function() {
  Main.init();
}, false);
