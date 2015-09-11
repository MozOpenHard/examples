'use strict';

var rPort;
var gPort;
var bPort;

window.addEventListener('load', function (){
  
  var v = 0;
  Promise.all([
    navigator.setGpioPort(244,"out"),
    navigator.setGpioPort(243,"out"),
    navigator.setGpioPort(246,"out")
  ]).then( ports=>{
    
    rPort = ports[0];
    gPort = ports[2];
    bPort = ports[1];
    setColor([0,0,0]);
  });

}, false);

// color = [r,g,b]
function setColor(color){
  rPort.write(color[0]);
  gPort.write(color[1]);
  bPort.write(color[2]);
}