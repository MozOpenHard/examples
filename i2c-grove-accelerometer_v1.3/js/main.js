'use strict';

var _i2cPort;
var _deviceaddress = 0x4c;

window.addEventListener('load', function (){
  function Sleep(millisec) {
    var start = new Date();
    while(new Date() - start < millisec);
  }

  navigator.requestI2CAccess().then(
    function(i2cAccess) {
      var _i2cPort = i2cAccess.open(0);
      
      GroveAccelerometer.init(_i2cPort,_deviceaddress).then(function(){
        setInterval(function(){
          GroveAccelerometer.read(_i2cPort,_deviceaddress).then(values => {
            var x=values.x;
            var y=values.y;
            var z=values.z;
            console.log(x+"g",y+"g",z+"g");
            document.getElementById("debug").innerHTML = x + "g," + y + "g," + z + "g";
          });
        },1000);
      });
      
    },
    function(error) {
      console.log(error.message);
    }
  );
}, false);

