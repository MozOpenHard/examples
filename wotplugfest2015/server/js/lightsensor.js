window.sensors = window.sensors || {};

window.sensors.Lightsensor = window.sensors.Lightsensor || function(){
  
  var self = this;
  self.init = false;
  self.brightness = null;
  
  
  function onchange() {
    if (typeof self.onchange == "function") {
      self.onchange({
        data: {
          brightness: self.brightness
        }
      });
    }
  }
  

  function onerror(err) {
    if (typeof self.onerror == "function") {
      self.onerror(err);
    }
  }
 
  navigator.requestI2CAccess().then(
    function(i2cAccess) {
      _i2cport = i2cAccess.open(0);
      
      GroveLight.init(_i2cport,_deviceAddress).then(function(){
        self.init = true;
        setInterval(function(){
          GroveLight.read(_i2cport,_deviceAddress).then(value => {
            //console.log(value)
            document.getElementById("debug").innerHTML = value;
            if(self.brightness != value){
              self.brightness = value;
              onchange();
            }
            _brightness = value; 
          });
        },1000);
      },function(err){
        onerror(err);
      });
    },
    function(err) {
      console.log(err.message);
      onerror(err);
    }
  );
  
};

window.sensors.Lightsensor.requestData = function(){
  return new Promise(function(resolve, reject) {
    function onsuccess(position) {
      resolve({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy
      });
    }

    function onerror(err) {
      if (err.code === err.TIMEOUT) {
        resolve(null);
      } else {
        reject(err);
      }
    }
    var timeout = Infinity;
    if ("timeout" in options) timeout = options.timeout;
    if (options.fromCache) timeout = 0; // instant timeout to only get data from the cache

    if(!window.sensor.lightsensor.init){
      reject();
    }else {
      GroveLight.read(_i2cport,_deviceAddress).then(value => {
        console.log(value)
        document.getElementById("debug").innerHTML = value;
        if(self.brightness != value){
          onchange();
        }
        _brightness = value; 
      });
    }
  });
}
