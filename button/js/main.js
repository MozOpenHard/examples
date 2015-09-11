'use strict';

window.addEventListener('load', function (){
  
  var v = 0;
  Promise.all([
    navigator.setGpioPort(198,"out"),
    navigator.setGpioPort(199,"in")
  ]).then(ports=>{
    var ledPort = ports[0];
    var buttonPort = ports[1];
    
    buttonPort.onchange = function(){
      console.log("onchange");
      v = v ? 0:1;
      ledPort.write(v);
    }
  });

}, false);
