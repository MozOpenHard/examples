"use strict";

var Main = {
  init: function() {
    navigator.requestI2CAccess().then(function(i2cAccess) {
      return i2cAccess.open(2);
    }).then(function(i2cPort) {
      return i2cPort.open(0x40);
    }).then(function(i2cSlave) {
      Main.gp2Y0E03 = new GP2Y0E03(i2cSlave);
      return Main.gp2Y0E03.init();
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
    Main.gp2Y0E03.read().then(function(value) {
      var distance = value;
      console.log("distance:" + distance);
      document.getElementById("distance").textContent = distance;
      setTimeout(Main.read, 500);
    }).catch(function(reason) {
      console.log("READ ERROR:" + reason);
    });
  }
}

window.addEventListener("DOMContentLoaded", function() {
  Main.init();
}, false);
