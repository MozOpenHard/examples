var GroveTouch = {
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
        port.write8(0x2b,0x01);
        yield self.sleep(1, thread);
        port.write8(0x2c,0x01);
        yield self.sleep(1, thread);
        port.write8(0x2d,0x01);
        yield self.sleep(1, thread);
        port.write8(0x2e,0x01);
        yield self.sleep(1, thread);
        
        port.write8(0x2f,0x01);
        yield self.sleep(1, thread);
        port.write8(0x30,0x01);
        yield self.sleep(1, thread);
        port.write8(0x31,0xff);
        yield self.sleep(1, thread);
        port.write8(0x32,0x02);
        yield self.sleep(1, thread);
        
        
        for(var i=0;i<12*2;i+=2){
          console.log(i);
          var address = 0x41+i;
          console.log(address);
          port.write8(address,0x0f);
          yield self.sleep(1, thread);
          port.write8(address+1,0x0a);
          yield self.sleep(1, thread);
        }

        
        port.write8(0x5d,0x04);
        yield self.sleep(1, thread);
        port.write8(0x5e,0x0c);
        yield self.sleep(1, thread);
      
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
          port.read8(0x00,true),
          port.read8(0x01,true)
        ]).then(function(v){
          console.log(v[0],v[1]);
          var value = ((v[1] << 8) + v[0]);
          console.log(value);
          var array = self.arrayFromMask(value);
          resolve(array);
        },function(){
          reject();
        });
      })();
      thread.next();
    });
  },
  arrayFromMask:function arrayFromMask (nMask) {
    if (nMask > 0x7fffffff || nMask < -0x80000000) { throw new TypeError("arrayFromMask - out of range"); }
    for (var nShifted = nMask, aFromMask = []; nShifted; aFromMask.push(Boolean(nShifted & 1)), nShifted >>>= 1);
    return aFromMask;
  }
};
