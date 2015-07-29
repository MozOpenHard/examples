var ADT7410 = {
  /*
  * read function
  * port : i2c port object
  * address : device address
  */
  read:function readTempSensor(port,address){
    port.setDeviceAddress(address);
    return new Promise(function(resolve,reject){
      Promise.all([
        port.read8(0x00,true),
        port.read8(0x01,true)
      ]).then(function(v){
        var temp = ((v[0] << 8) + v[1]) / 128.0;
        resolve(temp);
      },function(){
        console.log("error");
        reject();
      });
    });
  }
};