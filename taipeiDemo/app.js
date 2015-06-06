//for geckoGpios.js
window.addEventListener("load", function() {
  Promise.all([
    // init gpio ports
    navigator.setGpioPort(198,"in"),
    navigator.setGpioPort(199,"out"),
    // init I2C ports
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
 
  //Web button change event
  btnEle.onclick = function(){
    changeDisplayColor();
    toggleLed();
  };
  
  //Physical button change event
  btnPort.onchange = function(value){
    if(value == 0){
      changeDisplayColor();
      toggleLed();
    }
  };
  
  
  // read temperature sensor every second
  setInterval(function(){
    readTempSensor().then(value => {
        print("valueEle1",value);
    });
  },1000);
  
  // read Distance sensor every second
  setInterval(function(){
    readDistSensor().then(value => {
      print("valueEle2",value);
    });
  },1000);
  
  // change background color
  function changeDisplayColor(){
    console.log("change display color.");
    if(!displayColor){
      document.body.style.background = "#7280FA";
      displayColor = true;
    }else{
      document.body.style.background = "#FFFFFF";
      displayColor = false;
    }
  }
  
  //toggle led light
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
  
  //read temperature sensor
  function readTempSensor(){
    return new Promise(function(resolve,reject){
      
      //get temperature value
      Promise.all([
        tempSensor.read(0x00,true),
        tempSensor.read(0x01,true)
      ]).then(function(v){
        console.log(v[0] +','+ v[1]);
        //calculate temperature
        var temp = ((v[0] << 8) + v[1]) / 128.0;
        resolve(temp);
      },function(){
        reject();
      });
    });
  }
  
  // read distance sensor
  function readDistSensor(threshold){
    console.log("read dist");
    return new Promise(function(resolve,reject){
      
      // measure distance
      distSensor.write8(0x00,0x00);
      sleep(1);
      distSensor.write8(0x00,0x51);
      sleep(70);
      
      // get distance value
      Promise.all([
        distSensor.read(0x02,true),
        distSensor.read(0x03,true)
      ]).then(function(v){
        
        //calculate distance
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
