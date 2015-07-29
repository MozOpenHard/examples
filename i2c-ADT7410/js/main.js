'use strict';

window.addEventListener('load', function (){

  navigator.requestI2CAccess().then(
    function(i2cAccess) {
      //open i2c-0 port
      var port = i2cAccess.open(0);
      
      setInterval(function(){
        //read temperature sensor
        ADT7410.read(port,0x48).then(value=>{
          console.log(value);
          document.getElementById("debug").innerHTML = value;
        });
      },1000);
      
    },
    function(error) {
      console.log(error.message);
    }
  );
}, false);
