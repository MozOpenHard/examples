var SRF02 = {
  sleep: function(ms, generator) {
    setTimeout(function(){
      try {
        generator.next();
      } catch (e) {
        if (! (e instanceof StopIteration)) throw e;
      }
    }, ms);
  },
  read:function (port,address){
    var self = this;
    port.setDeviceAddress(address);

    return new Promise(function(resolve,reject){
      var thread = (function* (){
        port.write8(0x00,0x00);
        yield self.sleep(1, thread);
        port.write8(0x00,0x51);
        yield self.sleep(70, thread);
      
        // get distance value
        Promise.all([
          port.read8(0x02,true),
          port.read8(0x03,true)
        ]).then(function(v){
          var dist = ((v[0] << 8) + v[1]);
          resolve(dist);
        },function(){
          reject();
        });
      })();
      thread.next();
    });
  }
};