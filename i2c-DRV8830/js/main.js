'use strict';

var _i2cPort;
var _deviceaddress = 0x64;

window.addEventListener('load', function (){
  function Sleep(millisec) {
    var start = new Date();
    while(new Date() - start < millisec);
  }

  navigator.requestI2CAccess().then(
    function(i2cAccess) {
      var _i2cPort = i2cAccess.open(0);
      
      DRV8830.init(_i2cPort,_deviceaddress).then(function(){
        
        document.getElementById("front").addEventListener("click",function(){
          console.log("front");
          DRV8830.front(_i2cPort,_deviceaddress).then(function(){
            console.log("success");
            document.getElementById("debug").innerHTML = "front";
          });
        });
        document.getElementById("back").addEventListener("click",function(){
          console.log("back");
          DRV8830.back(_i2cPort,_deviceaddress).then(function(){
            console.log("success");
            document.getElementById("debug").innerHTML = "back";
          });
        });
        document.getElementById("stop").addEventListener("click",function(){
          console.log("stop");
          DRV8830.stop(_i2cPort,_deviceaddress).then(function(){
            console.log("success");
            document.getElementById("debug").innerHTML = "stop";
          });
        });
        
      });
      
    },
    function(error) {
      console.log(error.message);
    }
  );
}, false);

