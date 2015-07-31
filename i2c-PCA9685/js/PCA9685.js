var PCA9685 = {
  sleep: function(ms, generator) {
    setTimeout(function(){
      try {
        generator.next();
      } catch (e) {
        if (! (e instanceof StopIteration)) throw e;
      }
    }, ms);
  },
  init:function (port,address,noSetZero){
    console.log("init" + address);
    var self = this;
    port.setDeviceAddress(address);

    return new Promise(function(resolve,reject){
      var thread = (function* (){

        console.log(0x00,0x00);
        port.write8(0x00,0x00);
        yield self.sleep(10, thread);
        console.log(0x01,0x04);
        port.write8(0x01,0x04);
        yield self.sleep(10, thread);

        console.log(0x00,0x10);
        port.write8(0x00,0x10);
        yield self.sleep(10, thread);
        console.log(0xfe,0x64);
        port.write8(0xfe,0x64);
        yield self.sleep(10, thread);
        console.log(0x00,0x00);
        port.write8(0x00,0x00);
        yield self.sleep(10, thread);
        console.log(0x06,0x00);
        port.write8(0x06,0x00);
        yield self.sleep(10, thread);
        console.log(0x07,0x00);
        port.write8(0x07,0x00);
        yield self.sleep(300, thread);


        if ( !noSetZero ){
          for ( var servoPort = 0 ; servoPort < 16 ; servoPort ++ ){
            self.setServo(port , address,servoPort , 0 ).then(
              function(){
                resolve();
              },
              function(){
                reject();
              }
            );
          }
        }

      })();
      thread.next();
    });
  },
  setServo:function (port,address,servoPort,angle){
    console.log("setServo ");
    var self = this;
    port.setDeviceAddress(address);
    
    var portStart = 8;
    var portInterval = 4;
    
    var center = 0.001500; // sec ( 1500 micro sec)
    var range  = 0.000600; // sec ( 600 micro sec) a bit large?
    var angleRange = 50.0;
    
    if ( angle > angleRange){
      angle = angleRange;
    } else if ( angle < -angleRange ){
      angle = - angleRange;
    }
        
    var freq = 61; // Hz
    var tickSec = ( 1 / freq ) / 4096; // 1bit resolution( sec )
    var centerTick = center / tickSec;
    var rangeTick = range / tickSec;
        
    var gain = rangeTick / angleRange; // [tick / angle]
        
    var ticks = Math.round(centerTick + gain * angle);
        
    var tickH = (( ticks >> 8 ) & 0x0f);
    var tickL = (ticks & 0xff);
        
    return new Promise(function(resolve,reject){
      var thread = (function* (){
        console.log( Math.round(portStart + servoPort * portInterval + 1), tickH);
        port.write8( Math.round(portStart + servoPort * portInterval + 1), tickH);
        yield self.sleep(1, thread);
        console.log( Math.round(portStart + servoPort * portInterval), tickL);
        port.write8( Math.round(portStart + servoPort * portInterval), tickL);
        
        resolve();
      
      })();
      thread.next();
    });
  }
}