

var GPIO = {
  gpio:null,
  requestGPIOAccess: navigator.requestGPIOAccess,
  setPort: function(portno,dist){
    var self = this;
    return new Promise(function(resolve, reject){
      self.gpio.ports.get(portno).then(
        function(gpioPort){
          gpioPort.export(dist).then(
            function(){
              console.log('export OK');
              /*
              var port = new Object();
              port.write = function(v){
                gpioPort.write(v).then(
                  function() { console.log('write to port OK'); },
                  function() { console.log("Failed to write GPIO port: " + error.message); }
                );
              };
              port.read = function(resolve,reject){
                gpioPort.read().then(
                  function(value){ console.log(value);resolve(value);},
                  function(){reject();}
                );
              };
              */
              resolve(gpioPort);
            },
            function() {
              console.log('export NG'); 
              reject();
            }
          );
        },
        function(error) {
          console.log("Failed to get GPIO port: " + error.message);
          reject();
        }
      );
    });
  },
  /*
  setPort: function(portno,dist){
    var self = this;
    return new Promise(function(resolve, reject){
      navigator.requestGPIOAccess().then(
        function(gpioAccess) {
          self.gpio = gpioAccess;
          console.log("GPIO ready!");
        },
        function(error) {
          console.log("Failed to get GPIO access: " + error.message);
        }
      ).then(function(){
        self.gpio.ports.get(portno).then(
          function(gpioPort){
            gpioPort.export(dist).then(
              function(){
                console.log('export OK');
                var port = new Object();
                port.write = function(v){
                  gpioPort.write(v).then(
                    function() { console.log('write to port OK'); },
                    function() { console.log("Failed to write GPIO port: " + error.message); }
                  );
                };
                port.read = function(resolve,reject){
                  gpioPort.read().then(
                    function(value){ console.log(value);resolve(value);},
                    function(){reject();}
                  );
                };
                resolve(port);
              },
              function() {
                console.log('export NG'); 
                reject();
              }
            );
          },
          function(error) {
            console.log("Failed to get GPIO port: " + error.message);
            reject();
          }
        );
      });
    });
  },
  */
  /*
  getPort: function(portno){
    var self = this;
    return new Promise(function(resolve, reject){
      navigator.requestGPIOAccess().then(
        function(gpioAccess) {
          self.gpio = gpioAccess;
          console.log("GPIO ready!");
        },
        function(error) {
          console.log("Failed to get GPIO access: " + error.message);
        }
      ).then(function(){
        self.gpio.ports.get(portno).then(
          function(gpioPort) {
            var port = new Object();
            port.write = function(v){
              gpioPort.export("out").then(
                function(){
                  console.log('export OK');
                  gpioPort.write(v).then(
                    function() { console.log('write to port OK'); },
                    function() { console.log("Failed to write GPIO port: " + error.message); }
                  );
                },
                function() { console.log('export NG'); }
              );
            };
            port.read = function(resolve,reject){
              gpioPort.export("in").then(
                function(){
                  console.log('export OK');
                  gpioPort.read().then(
                    function(value){ console.log(value);resolve(value);},
                    function(){reject();}
                  );
                },
                function(){console.log('export NG');}
              );
            };
            resolve(port);
            console.log("port ready!");
          },
          function(error) {
            console.log("Failed to get GPIO port: " + error.message);
            reject();
          }
        );
      });
    });
  }
  */
};
