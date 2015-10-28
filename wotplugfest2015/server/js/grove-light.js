var GroveLight = {
  sleep: function(ms, generator) {
    setTimeout(function(){
      try {
        generator.next();
      } catch (e) {
        if (! (e instanceof StopIteration)) throw e;
      }
    }, ms);
  },
  init:function (port,address){
    var self = this;
    port.setDeviceAddress(address);

    return new Promise(function(resolve,reject){
      var thread = (function* (){
        port.write8(0x80,0x03);
        yield self.sleep(400, thread);
        port.write8(0x81,0x00);
        yield self.sleep(14, thread);
        port.write8(0x86,0x00);
        yield self.sleep(10, thread);
        port.write8(0x80,0x00);
        yield self.sleep(400, thread);
        port.write8(0x80,0x03);
        yield self.sleep(400, thread);
      
        resolve();
        
      })();
      thread.next();
    });
  },
  read:function (port,address){
    var self = this;
    port.setDeviceAddress(address);

    return new Promise(function(resolve,reject){
      var thread = (function* (){
        
        // get light value
        Promise.all([
          port.read8(0x8d,true),
          port.read8(0x8c,true)
        ]).then(function(v){
          var value = ((v[0] << 8) + v[1]);
          resolve(value);
        },function(){
          reject();
        });
      })();
      thread.next();
    });
  }
};