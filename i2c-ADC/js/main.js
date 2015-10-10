'use strict';

window.addEventListener('load', function (){
  function Sleep(millisec) {
    var start = new Date();
    while(new Date() - start < millisec);
  }

  navigator.requestI2CAccess().then(
    function(i2cAccess) {
      var port = i2cAccess.open(0);
      
      setInterval(function(){
        SRF02.read(port,0x55).then(value => {
          console.log(value)
          document.getElementById("debug").innerHTML = value + "<br>";
          document.getElementById("debug").innerHTML += (value*3.00*2)/4096 + "<br>";
          document.getElementById("bar").style.width = ((value*3.00*2)/4096)*20 + "px";
        });
      },10);
    },
    function(error) {
      console.log(error.message);
    }
  );
}, false);


