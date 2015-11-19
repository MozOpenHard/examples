var DRV8830 = {
  EARTH_GRAVITY_MS2:9.80665,
  SCALE_MULTIPLIER:0.004,
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
        port.write8(0x00,0x00);
        yield self.sleep(2000, thread);
       

        resolve();
        
      })();
      thread.next();
    });
  },
  front:function (port,address){
    var self = this;
    port.setDeviceAddress(address);
    
    console.log("drive");

    var x,y,z;
    return new Promise(function(resolve,reject){
      var thread = (function* (){
        
        value = 0x3F<<2 | 0x01;
        port.write8(0x00,value);
        yield self.sleep(10, thread);
        
        resolve();
    
      })();
      thread.next();
    });
  },
  back:function (port,address){
    var self = this;
    port.setDeviceAddress(address);
    
    console.log("drive");

    var x,y,z;
    return new Promise(function(resolve,reject){
      var thread = (function* (){
        
        value = 0x3F<<2 | 0x02;
        port.write8(0x00,value);
        yield self.sleep(10, thread);
        
        resolve();
    
      })();
      thread.next();
    });
  },
  stop:function (port,address){
    var self = this;
    port.setDeviceAddress(address);
    
    console.log("drive");

    var x,y,z;
    return new Promise(function(resolve,reject){
      var thread = (function* (){
        
        value = 0x00;
        port.write8(0x00,value);
        yield self.sleep(10, thread);
        
        resolve();
    
      })();
      thread.next();
    });
  }
};