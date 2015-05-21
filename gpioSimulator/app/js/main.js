window.onload = function(){
  /*
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
  */
  GPIO.getPort(196).then(init);
  
  function init(port){
    document.getElementById("write1").addEventListener("click",function(){
      port.write(1);
    });
    document.getElementById("write0").addEventListener("click",function(){
      port.write(0);
    });
    document.getElementById("read").addEventListener("click",function(){
      
      port.read(
        function(value){
          console.log("get value: "+value);
          document.getElementById("readvalue").innerHTML = value;
        },
        function(){
          console.log("read failed");
        }
      );
    });
  }

  
};