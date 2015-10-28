function Things(uri){
  this.uri = uri;
  this.oneventemit = new Object();
  this.timer;
}
Things.prototype = {
  subscribe:function(event,func){
    var self = this;
    console.log("thigs subscribe");
    this.oneventemit[event] = func;
    this.timer = setInterval(self._check.bind(self),1000);
  },
  get:function(name){
    var self = this;
    return new Promise(function(resolve,reject){
      self._send("get/"+name,resolve);
    });
  },
  _check:function(){
    //console.log("_check");
    var self = this;
    this._send("check/event",(function(evt){
      if(evt){
        //console.log(evt);
        if(typeof this.oneventemit[evt.name] === "function"){
          this.oneventemit[evt.name](evt.data);
        }else{
          console.log("function undefined");
        }
      }
    }).bind(self));
  },
  _send:function(cmd,func){
    //console.log("send"+this.uri);
    //var xhr = new XMLHttpRequest({mozSystem: true});
    var xhr = new XMLHttpRequest();
    //xhr.open('GET', url, true);
    xhr.open('GET', this.uri + cmd, true);
    xhr.onreadystatechange = function(){
      if (xhr.readyState === 4 && xhr.status === 200){
        //console.log(xhr.responseText);
        func(JSON.parse(xhr.responseText));
      }
    };
    xhr.send(null);
  }
}

function WoT(){}

WoT.prototype = {
  connect:function(uri){
    console.log("wot" + uri);
    return new Things(uri);
  }
}

