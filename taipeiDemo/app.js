//for geckoGpios.js
window.addEventListener("load", function() {
  console.log("Hello Real World!");
  Promise.all([
    navigator.setGpioPort(198,"in"),
    navigator.setGpioPort(199,"out"),
    navigator.setI2cPort(0,0x48)
  ]).then(gpioLoad);
});

function gpioLoad(ports){
  console.log("gpio load");
  var displayColor = false;
  var ledValue = false;
  
  var btnEle = document.getElementById("webbtn");
  var btnPort = ports[0];
  var ledPort = ports[1];
  var tempSensor = ports[2];
 
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
  
  setInterval(function(){
    readTempSensor(31.0).then(
      function(){displayColor=false;changeDisplayColor();},
      function(){displayColor=true;changeDisplayColor();}
    );
  },1000);
  
  
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
  
  //readTempSensor
  function readTempSensor(threshold){
    return new Promise(function(resolve,reject){
      Promise.all([
        tempSensor.read(0x00,true),
        tempSensor.read(0x01,true)
      ]).then(function(v){
        var temp = ((v[0] << 8) + v[1]) / 128.0;
        console.log(temp);
        console.log(threshold);
        if(threshold < temp){
          resolve();
        }else{
          reject();
        }
      });
    });
  }
}
