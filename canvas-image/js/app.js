var r_port;
var g_port;
var b_port;


window.addEventListener("DOMContentLoaded", function() {
  console.log("load");
  var v = 0;
  Promise.all([
    navigator.setGpioPort(244,"out"),
    navigator.setGpioPort(243,"out"),
    navigator.setGpioPort(246,"out")
  ]).then(ports=>{  
    r_port = ports[0];
    g_port = ports[2];
    b_port = ports[1];

    var url = "http://fabble.cc/uploads/user/avatar/53b32de769702d1d5f020000/thumb_1164542.jpeg";
    //var url = "http://eoimages.gsfc.nasa.gov/images/imagerecords/86000/86564/greenland_oli_2015196_front.jpg";
    var dataURL = getImageDataURL(url);
    loadImage(dataURL);
  });
  
});

function getImageDataURL(url) {
  var req = new XMLHttpRequest({mozSystem: true});
  req.overrideMimeType("text/plain; charset=x-user-defined");
  req.open("GET", url, false);
  req.send(null);
  if(req.status != 200) {
    console.log("error not get the image[" + req.status + "]");
    return;
  }
  var stream = req.responseText;
  var bytes = [];
  for(var i = 0; i< stream.length; i++) {
    bytes[i] = stream.charCodeAt(i) & 0xff;
  }
  return "data:image/jpeg;base64," + btoa(String.fromCharCode.apply(String, bytes));
}

function loadImage(url) {
  var image = new Image();
  image.onload = function() {
    console.log(image);
    var canvas = document.getElementById("canvas");
    var context = canvas.getContext("2d");
    context.drawImage(image, 0, 0);
    try {
      for (var y = 0, width = image.width, height = image.height; y < height; y++) {
        for (var x = 0; x < width; x++) {
          var pixel = context.getImageData(x, y, 1, 1).data;
          toLigth(pixel);
          Sleep(1);
          if((y>=height-1) && (x>= width-1)){
            console.log("end");
            y=0;x=0;
          }
        }
      }
    } catch(e) { console.log(e);}
  }
  image.src = url;
}

function Sleep(millisec) {
  var start = new Date();
  while(new Date() - start < millisec);
}

function toLigth(pixel) {
  var r = pixel[0];
  var g = pixel[1];
  var b = pixel[2];
  if (r > 128) {
    r_port.write(1);
  } else {
    r_port.write(0);
  }
  if (g > 128) {
    g_port.write(1);
  } else {
    g_port.write(0);
  }
  if (b > 128) {
    b_port.write(1);
  } else {
    b_port.write(0);
  }
}