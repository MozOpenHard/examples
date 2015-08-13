'use strict';
var direction=1;

window.addEventListener('load', function (){
  function Sleep(millisec) {
    var start = new Date();
    while(new Date() - start < millisec);
  }

  navigator.requestI2CAccess().then(
    function(i2cAccess) {
      var port = i2cAccess.open(0);
      
      var angle = 0;
      PCA9685.init(port,0x40).then(function(){
        setInterval(function(){
          
          console.log(angle);
          PCA9685.setServo(port,0x40,0,angle);
          angle +=1 * direction;
          if(angle > 50){
            direction = -1;
          }else if(angle < -50){
            direction = 1;
          }
          
        },100);
      });
    },
    function(error) {
      console.log(error.message);
    }
  );
}, false);
