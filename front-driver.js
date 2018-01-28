"use strict"

// html 相关的

var screen =  new Screen({
  loaded: (dotter)=>{
    $("#loaded").css("display","block")
    $("#loading").css("display","none")
    clearInterval(dotter)
    $("#clear").css("display","none")
  },
  socketClose: ()=>{
    console.log('Connection closed.');
    $("#closed").html("Connection Closed");
    $("#clear").css("display","inline")
  },
  dotter: setInterval(()=>{$("#dots").append(".")},50),
  getColor: ()=>{
    var color = $("#color").val();
    return [parseInt(color.substr(1,2),16),
      parseInt(color.substr(3,2),16),
      parseInt(color.substr(5,2),16)]
  }
});
screen.init()

//拖动的时候...

$("#position").html(`X: ${screen.selectX}, Y: ${screen.selectY}`);
$("#container").on("mousedown",(e)=>{
  screen.selectX = Math.round((e.pageX - screen.offsetX)/screen.unitSize);
  screen.selectY = Math.round((e.pageY - screen.offsetY)/screen.unitSize);
  location.hash=`${screen.selectX},${screen.selectY}`;
  $("#position").html(`X: ${screen.selectX}, Y: ${screen.selectY}`);
  var startX=e.pageX;
  var startY=e.pageY;
  var tmpOffsetX = screen.offsetX;
  var tmpOffsetY = screen.offsetY;
  screen.selectRectCanvas.update()
  $("#container").on("mousemove",(es)=>{
    screen.offsetX = es.pageX - startX + tmpOffsetX
    screen.offsetY = es.pageY - startY + tmpOffsetY
    screen.two.update()
    screen.selectRectCanvas.update()
  });
})
$("#container").on("mouseup",(e)=>{
  $("#container").off("mousemove")
  screen.checkRequery()
})

if(screen.two.type != "SVGRenderer"){
  $(window).on("resize",()=>{
    screen.two.update()
    screen.selectRectCanvas.update()
  })
}
//一些键盘操作
$(window).on("keydown",function(e) {
  if(e.keyCode == 32){
    //空格
    screen.colorIt();
  }
  if(37<=e.keyCode && e.keyCode<=40){
    switch(e.keyCode){
      case 37://left
        if(e.ctrlKey){
          screen.offsetX += screen.unitSize
        }
        screen.selectX -= 1;
        break;
      case 38://up
        if(e.ctrlKey){
          screen.offsetY += screen.unitSize
        }
        screen.selectY -= 1;
        break;
      case 39://right
        if(e.ctrlKey){
          screen.offsetX -= screen.unitSize
        }
        screen.selectX += 1;
        break;
      case 40://down
        if(e.ctrlKey){
          screen.offsetY -= screen.unitSize
        }
        screen.selectY += 1;
        break;
    }
    location.hash=`${screen.selectX},${screen.selectY}`;
    $("#position").html(`X: ${screen.selectX}, Y: ${screen.selectY}`);
    if(e.ctrlKey){
      screen.two.update()
      screen.checkRequery()
    }else{
      screen.selectRectCanvas.update()
    }
  }
  if(65<=e.keyCode && e.keyCode<=87){
    var color = $("#color").val()
    var colorData = [parseInt(color.substr(1,2),16),
      parseInt(color.substr(3,2),16),
      parseInt(color.substr(5,2),16)]
    var scale = 16
    var tmp
    switch(e.keyCode){
      case 81:
        if(colorData[0]+scale<=255)
          colorData[0] += scale;
        break;
      case 87:
        if(colorData[1]+scale<=255)
          colorData[1] += scale;
        break;
      case 69:
        if(colorData[2]+scale<=255)
          colorData[2] += scale;
        break;
      case 65:
        if(colorData[0]-scale>=0)
          colorData[0] -= scale;
        break;
      case 83:
        if(colorData[1]-scale>=0)
          colorData[1] -= scale;
        break;
      case 68:
        if(colorData[2]-scale>=0)
          colorData[2] -= scale;
        break;
    }
    //q 81
    //w 87
    //e 69
    //a 65
    //s 83
    //d 68
    var res = "#"+colorData.map((n)=>{
      var s = n.toString(16)
      if(s.length==1){
        s = `0${s}`
      }
      return s
    }).join("")
    $("#color").val(res)
  }
});

//color it
$("#button").on("click",()=>screen.colorIt())
$("#clear").on("click",()=>screen.clearCanvas())

//人性化响应

$("#color").on("change",()=>$("#color").blur())
