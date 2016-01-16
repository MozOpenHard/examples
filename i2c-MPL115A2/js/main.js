"use strict";

var Main = {
  init: function() {
    navigator.requestI2CAccess().then(function(i2cAccess) {
      return i2cAccess.open(0);
    }).then(function(i2cPort) {
      return i2cPort.open(0x60);
    }).then(function(i2cSlave) {
      Main.mpl115A2 = new MPL115A2(i2cSlave);
      return Main.mpl115A2.init();
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
    Main.mpl115A2.read().then(function(values) {
      var pressure = values[0];
      var temperature = values[1];
      console.log("pressur:" + pressure + " temperature:" + temperature);
      document.getElementById("pressure").textContent = pressure;
      document.getElementById("temperature").textContent = temperature;
      setTimeout(Main.read, 1000);
    }).catch(function(reason) {
      console.log("READ ERROR:" + reason);
    });
  }
}

window.addEventListener("DOMContentLoaded", function() {
  Main.init();
}, false);
