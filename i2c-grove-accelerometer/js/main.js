'use strict';

window.addEventListener('load', function (){
  function Sleep(millisec) {
    var start = new Date();
    while(new Date() - start < millisec);
  }

  navigator.requestI2CAccess().then(
    function(i2cAccess) {
      var port = i2cAccess.open(0);
      
      
      GroveAccelerometer.init(port,0x53).then(function(){
        setInterval(function(){
          GroveAccelerometer.read(port,0x53).then(values => {
            var x=values.x;
            var y=values.y;
            var z=values.z;
            console.log(x,y,z);
            document.getElementById("debug").innerHTML = x + "," + y + "," + z;
          });
        },1000);
      });
      
    },
    function(error) {
      console.log(error.message);
    }
  );
}, false);
