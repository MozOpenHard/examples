window.onload = function(){
  var v = 0;
  GPIO.getPort(196).then(
    function(port) {
      setInterval(toggleLight, 1000, port);
    }
  );
  function toggleLight(port){
    v = v ? 0 : 1;
    port.write(v);
  }    
};