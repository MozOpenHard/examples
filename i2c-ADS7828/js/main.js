"use strict";

var Main = {
  init: function() {
    navigator.requestI2CAccess().then(function(i2cAccess) {
      return i2cAccess.open(0);
    }).then(function(i2cPort) {
      return i2cPort.open(0x48);
    }).then(function(i2cSlave) {
      Main.ads7828 = new ADS7828(i2cSlave);
      return Main.ads7828.init();
    }).then(function() {
      Main.start();
    }).catch(function(reason) {
      console.log("ERROR:" + reason);
    });
  },

  start: function() {
    setInterval(function() {
      Promise.all([
        Main.ads7828.read(0x8c),
        Main.ads7828.read(0xac)
      ]).then(function(values) {
        var v0x8c = values[0];
        var v0xac = values[1];
        console.log("0x8c:" + v0x8c + " 0xac:" + v0xac);
        document.getElementById("value1").textContent = v0x8c;
        document.getElementById("value2").textContent = v0xac;
      }).catch(function(reason) {
        console.log("READ ERROR:" + reason);
      });
    }, 300);
  }
}

window.addEventListener("DOMContentLoaded", function() {
  Main.init();
}, false);
