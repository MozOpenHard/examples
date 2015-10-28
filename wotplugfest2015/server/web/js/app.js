/*
  https://github.com/w3c/wot/blob/master/TF-AP/Example_sketch.md
*/

window.addEventListener("load", function() {
  
  var wot = new WoT();
  //connect to a light sensor by its URI
  var thing = wot.connect("http://100.64.19.186:8001/");
  
  thing.subscribe('stateChanged',function(evt) {
    debug("sensor " + evt.src + " changed state at " + evt.time + " to " + evt.payload.brightness);
  });
  
  document.getElementById("btn").addEventListener("click",function(){
    thing.get('brightness')
       .then(function(res) {
         debug(res.value);
       });
  });
  
  
});

function debug(mes){
  console.log(mes);
  document.getElementById("debug").innerHTML = mes;
}
