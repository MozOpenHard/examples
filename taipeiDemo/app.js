//for geckoGpios.js
window.addEventListener("load", function() {
  console.log("Hello Real World!");
  Promise.all([
    navigator.setGpioPort(198,"in"),
    navigator.setGpioPort(199,"out"),
    navigator.setI2cPort(0,0x48),
    navigator.setI2cPort(2,0x70)
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
  var distSensor = ports[3];
 
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
  /*
  setInterval(function(){
    readTempSensor(31.0).then(
      function(){displayColor=false;changeDisplayColor();},
      function(){displayColor=true;changeDisplayColor();}
    );
  },1000);
  */
  
  setInterval(function(){
    readDistSensor().then(function(value){
      print("valueEle1",value);
      if(value < 50){
        changeDisplayColor();
      }
    });
  },1000);
  
  
  function changeDisplayColor(){
    console.log("change display color.");
    if(!displayColor){
      document.body.style.background = "#FA8072";
      displayColor = true;
    }else{
      document.body.style.background = "#FFFFFF";
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
        resolve(temp);
      },function(){
        reject();
      });
    });
  }
  
  function readDistSensor(threshold){
    console.log("read dist");
    return new Promise(function(resolve,reject){
      distSensor.write8(0x00,0x00);
      sleep(1);
      distSensor.write8(0x00,0x51);
      sleep(70);
      Promise.all([
        distSensor.read(0x02,true),
        distSensor.read(0x03,true)
      ]).then(function(v){
        console.log(v[0]);
        console.log(v[1]);
        var dist = ((v[0] << 8) + v[1]);
        resolve(dist);
      },function(){
        reject();
      });
    });
  }
  
  
  //utils
  function print(eleName,str){
    var ele = document.getElementById(eleName);
    ele.innerHTML = str;
    console.log(str);
  }
  
  function sleep(millisec) {
    var start = new Date();
    while(new Date() - start < millisec);
  }
}
