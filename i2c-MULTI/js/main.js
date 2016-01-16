"use strict";

var Main = {
  init: function() {
    navigator.requestI2CAccess().then(function(i2cAccess) {
      return i2cAccess.open(0);
    }).then(function(i2cPort) {
      return Promise.all([
        i2cPort.open(0x2a), //S11059
        i2cPort.open(0x53), //ADXL345
        i2cPort.open(0x48)  //ADS7828
      ]);
    }).then(function(i2cSlaves) {
      Main.s11059 = new S11059(i2cSlaves[0]);
      Main.adxl345 = new ADXL345(i2cSlaves[1]);
      Main.ads7828 = new ADS7828(i2cSlaves[2]);
      return Promise.all([
        Main.s11059.init(),
        Main.adxl345.init(),
        Main.ads7828.init()
      ])
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
    Promise.all([
      Main.s11059.read(),
      Main.adxl345.read(),
      Main.ads7828.read(0x8c),
      Main.ads7828.read(0xac)
    ])
    .then(function(valuesList) {
      var s11059Values = valuesList[0]
      var red = s11059Values[0];
      var green = s11059Values[1];
      var blue = s11059Values[2];
      console.log("red:" + red + " green:" + green + " blue:" + blue);
      document.getElementById("red").textContent = red;
      document.getElementById("green").textContent = green;
      document.getElementById("blue").textContent = blue;

      var adxl345 = valuesList[1]
      var x = adxl345[0];
      var y = adxl345[1];
      var z = adxl345[2];
      console.log("x:" + x + " y:" + y + " z:" + z);
      document.getElementById("x").textContent = x;
      document.getElementById("y").textContent = y;
      document.getElementById("z").textContent = z;

      var v0x8c = valuesList[2];
      var v0xac = valuesList[3];
      console.log("0x8c:" + v0x8c + " 0xac:" + v0xac);
      document.getElementById("value1").textContent = v0x8c;
      document.getElementById("value2").textContent = v0xac;

      setTimeout(Main.read, 100);
    }).catch(function(reason) {
      console.log("READ ERROR:" + reason);
    });
  }
}

window.addEventListener("DOMContentLoaded", function() {
  Main.init();
}, false);
