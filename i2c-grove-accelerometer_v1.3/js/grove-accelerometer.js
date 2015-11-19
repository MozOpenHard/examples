var GroveAccelerometer = {
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
        port.write8(0x07,0x00);
        yield self.sleep(10, thread);
        port.write8(0x08,0x02);
        yield self.sleep(10, thread);
        port.write8(0x07,0x01);
        yield self.sleep(10, thread);

        resolve();
        
      })();
      thread.next();
    });
  },
  read:function (port,address){
    var self = this;
    port.setDeviceAddress(address);

    var x,y,z;
    return new Promise(function(resolve,reject){
      var thread = (function* (){
        
        // get light value
        Promise.all([
          port.read8(0x00,true),
          port.read8(0x01,true),
          port.read8(0x02,true)
        ]).then(function(v){
          
          if(v[0] < 64){
            if(v[0]>32){
              x = v[0]-64;
            }else{
              x = v[0];
            }
          }else{
            x = 0; 
          }
          x = x/21.0;
        
          if(v[1] < 64){
            if(v[1]>32){
              y = v[1]-64;
            }else{
              y = v[1];
            }
          }else{
            y = 0; 
          }
          y = y/21.0;
          
          if(v[2] < 64){
            if(v[2]>32){
              z = v[2]-64;
            }else{
              z = v[2];
            }
          }else{
            z = 0; 
          }
          z = z/21.0;
        
          /*
          x = x*self.SCALE_MULTIPLIER;
          y = y*self.SCALE_MULTIPLIER;
          z = z*self.SCALE_MULTIPLIER;
          
          x = x*self.EARTH_GRAVITY_MS2;
          y = y*self.EARTH_GRAVITY_MS2;
          z = z*self.EARTH_GRAVITY_MS2;
          */
          x=Math.round(x*1000)/1000;
          y=Math.round(y*1000)/1000;
          z=Math.round(z*1000)/1000;
          
          
          var values = {"x": x, "y": y, "z": z};
          resolve(values);
        },function(){
          reject();
        });
      })();
      thread.next();
    });
  }
};