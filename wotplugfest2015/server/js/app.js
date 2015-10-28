var _i2cport;
var _deviceAddress = 0x29;
var _deviceInit = false;
var _brightness = 0;

var _event = null;
var _eventId = 1;
var _events = new Array();

//for geckoGpios.js
window.addEventListener("load", function() {

  if (typeof sensible == "object") {
    sensible.ApplicationFactory.createApplication(function(inError) {
      if (inError) {
        console.error ("error during sensible application startup");
        console.error (inError);
      } else {
        console.log ("sensible application startup");
        
        sensibleLoaded();
      }
    });
  }
});

function sensibleLoaded(){
  
  var sensor = new sensors.Lightsensor();
  sensor.onchange = function(evt){
    console.log(evt.data.brightness);
    _brightness = evt.data.brightness; 
    eventemit("stateChanged",{brightness:_brightness});
  }
  sensor.onerror = function(err){
    console.log("cannot read light sensor."+err);
  }
  /*
  navigator.requestI2CAccess().then(
    function(i2cAccess) {
      _i2cport = i2cAccess.open(0);
      
      
      GroveLight.init(_i2cport,_deviceAddress).then(function(){
        _deviceInit = true;
        setInterval(function(){
          GroveLight.read(_i2cport,_deviceAddress).then(value => {
            console.log(value)
            document.getElementById("debug").innerHTML = value;
            if(_brightness != value){
              eventemit("stateChanged",{brightness:value});
            }
            _brightness = value; 
          });
        },1000);
      });
      
      
      
    },
    function(error) {
      console.log(error.message);
    }
  );
  */
}

function eventemit(name,payload){
  _event = {name:name,data:{src:"80:1F:02:6E:E5:6E:app://chirimenplugfest.org",time:new Date(),payload:payload}};
  _events.push({name:name,id:_eventId,data:{src:"80:1F:02:6E:E5:6E:app://chirimenplugfest.org",time:new Date(),payload:payload}});
  _eventId++;
}

// called just before sensible.Application.start()
sensible.fxos.Application.prototype.onBeforeStart = function(inCallback) {
  console.log("onBeforeStart");
  inCallback();
};

// called just after sensible.Application.start()
sensible.fxos.Application.prototype.onAfterStart = function(inCallback) {
  sen = this;
  console.log("onAfterStart");
  inCallback();
};

sensible.fxos.Application.prototype.chirimen_brightness = function(inRequest, inCallback) {
  console.log("get properties - brihtness");
  var response = new Object();
  var self = this;
  
  var response = new Object();
  response.type = "json";
  response.object = { value: _brightness};
  inCallback (response);
  
};
sensible.fxos.Application.prototype.chirimen_statechanged = function(inRequest, inCallback) {
  console.log("get properties - brihtness");
  var response = new Object();
  var self = this;
  
  var response = new Object();
  response.type = "json";
  console.log(_events[_events.length -1]);
  response.object = _events[_events.length -1];
  inCallback (response);
  
};

sensible.fxos.Application.prototype.chirimen_checkevent = function(inRequest, inCallback) {
  console.log("get properties - brihtness");
  var response = new Object();
  var self = this;

  response.type = "json";
  response.object = _event;
  _event = null;
  inCallback (response);
  
  
};


