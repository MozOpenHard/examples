var GPIO = {
  gpio:null,
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
};
