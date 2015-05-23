

window.addEventListener("load", function() {
  console.log("Hello World!");
  GPIO.requestGPIOAccess().then(
    function(gpioAccess){
      GPIO.gpio = gpioAccess;
      Promise.all([
        GPIO.setPort(196,"in"),  //btnport
        GPIO.setPort(197,"out")  //ledport
      ]).then(gpioLoad,
        function(){
          console.log("failed promise.all");
        });
    },
    function(){
      console.log("request gpio access failed");
    }
  );
});

function gpioLoad(pins){
  console.log("gpio load");
  var displayColor = false;
  var ledValue = false;
  
  var btnEle = document.getElementById("webbtn");
  var btnPort = pins[0];
  var ledPort = pins[1];
 
  //btnEle.onclick = changeDisplayColor;
  btnEle.onclick = function(){
    changeDisplayColor();
    toggleLed();
  };
  btnPort.onchange = function(value){
    if(value == 0){
      changeDisplayColor();
      toggleLed();
    }
  };
  
  function changeDisplayColor(){
    console.log("change display color.");
    if(!displayColor){
      document.body.style.background = "#FFFFFF";
      displayColor = true;
    }else{
      document.body.style.background = "#666666";
      displayColor = false;
    }
  }
  
  function toggleLed(value){
    console.log("toggle led");
    if(!ledValue){
      ledPort.write(1);  
      ledValue = true;
    }else{
      ledPort.write(0);
      ledValue = false;
    }      
  }
  
  //todo
  function rotateMotor(){
    console.log("rotate motor");
  }
}

