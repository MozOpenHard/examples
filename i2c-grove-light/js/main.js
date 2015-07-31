'use strict';

window.addEventListener('load', function (){
  function Sleep(millisec) {
    var start = new Date();
    while(new Date() - start < millisec);
  }

  navigator.requestI2CAccess().then(
    function(i2cAccess) {
      var port = i2cAccess.open(0);
      
      
      GroveLight.init(port,0x29).then(function(){
        setInterval(function(){
          GroveLight.read(port,0x29).then(value => {
            console.log(value)
            document.getElementById("debug").innerHTML = value;
          });
        },1000);
      });
      
    },
    function(error) {
      console.log(error.message);
    }
  );
}, false);
