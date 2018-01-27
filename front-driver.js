"use strict"

function getWs(closeFunc){
  return new Promise((resolve)=>{
    var ws = new WebSocket((location.origin+location.pathname).replace("http","ws"));
    ws.onclose = closeFunc;
    ws.addPoints=async (points)=>{
      //console.log(args)
      ws.send(JSON.stringify(points[0]))
    }
    ws.query=(x1, y1, x2, y2, time)=>{
      //console.log(x1,y1,x2,y2,time)
      ws.send(JSON.stringify({time, x1, y1, x2, y2}));
    }
    // ws.query 与 tree.query 不一样
    ws.onopen=()=>{
      resolve(ws)
    }
  })
}

class Screen{
  constructor(argv){
    this.dotter = argv.dotter
    this.loaded = argv.loaded
    this.socketClose = argv.socketClose
    this.getColor = argv.getColor

    this.screen = this

    this.twoType = Two.Types.svg
    this.two = new Two({
      fullscreen: true,
      type: this.twoType,
      // autostart: true
    }).appendTo(document.getElementById("container"));
    this.selectRectCanvas = new Two({
      fullscreen: true,
      type: this.twoType,
    }).appendTo(document.getElementById("container"));

    this.tree = getTreeNode();

    this.ws = getWs(()=>{
      if(!this.inited){
        this.loaded(this.dotter)
      }
      this.socketClose()
      this.useServer = false;
      if(!this.inited){
        this.query()
      }
    })

    this.unitSize = 10; // 一个点的大小
    this.cacheParam = 1 // 预加载周围多大的范围
    this.offsetX = this.two.width/2;
    this.offsetY = this.two.height/2;

    this.selectX = 0;
    this.selectY = 0;

    if(location.search.length>1){
      this.unitSize = parseInt(location.search.substr(1))
    }
    if(location.hash.length>1){
      [this.selectX, this.selectY] = location.hash.substr(1).split(",").map((n)=>parseInt(n))
      this.offsetX -= this.selectX*this.unitSize
      this.offsetY -= this.selectY*this.unitSize
    }

    this.useServer = true;
    this.inited = false;

    this.group = this.two.makeGroup();

    this.selectRect = this.selectRectCanvas.makeRectangle(0, 0, this.unitSize, this.unitSize);
    this.selectRect.fill = "rgba(255, 0, 0, 0)";

    this.two.bind('update',this.fresh)
    this.selectRectCanvas.bind('update',this.freshRect)
    this.two.screen = this
    this.selectRectCanvas.screen = this
  }
  async init(){//query from local and server
    this.tree = await this.tree
    this.ws = await this.ws
    this.ws.screen = this
    console.log("connection open...")
    this.ws.onmessage = function(evt) {//this is this.ws
      var num = 0;
      for(var i of JSON.parse(evt.data)){
        this.screen.addPoints(i,"s")
        num += i.length
      }
      console.log("server",num)
      this.screen.two.update()
    };
    await this.query()
    this.loaded(this.dotter);
    this.inited = true;
  }
  async query(){
    if(this.useServer){
      this.ws.query(...this.getRange());
    }
    var data = await this.tree.query(...this.getRange());
    var num = 0
    for(var i of data){
      this.addPoints(i,"l");
      num += i.length
    }
    this.two.update();
    console.log("local",num)
  }
  getRange(){
    var w = this.two.width/this.unitSize;
    var h = this.two.height/this.unitSize;
    var x = -this.offsetX/this.unitSize;
    var y = -this.offsetY/this.unitSize;
    var c = this.cacheParam
    var res = [ x - c*w, y - c*h, x + (1+c)*w, y + (1+c)*h, 0]
    return res
  }
  addPoints(points, flag){
    if(flag!="l"){
      this.tree.addPoints(points)
    }
    if(flag=="h" && this.useServer){
      this.ws.addPoints(points)
    }

    var l = points.length
    for(var i=0;i<l;i++){
      var point
      if(flag="s"){//反向point
        point = points[l-i-1]
      }else{
        point = points[i]
      }
      var rect = this.two.makeRectangle(point.x*this.unitSize, point.y*this.unitSize, this.unitSize, this.unitSize);
      rect.fill = `rgb(${point.r},${point.g},${point.b})`
      rect.noStroke()
      this.group.add(rect)
    }
  }
  fresh(){//this is this.two
    this.screen.group.translation.set(this.screen.offsetX, this.screen.offsetY);
  }
  freshRect(){
    this.screen.selectRect.translation.set(this.screen.selectX*this.screen.unitSize+this.screen.offsetX,
      this.screen.selectY*this.screen.unitSize+this.screen.offsetY);
  }
  colorIt(){
    var color = this.getColor();
    var param = {
      x:this.selectX,
      y:this.selectY,
      r:color[0],
      g:color[1],
      b:color[2],
      t:Date.now()
    };
    this.addPoints([param],"h");
    this.two.update()
  }
  clearCanvas(){
    this.tree.dropData()
    this.group.children.map((n)=>n).map((n)=>n.remove())
    this.two.update()
  }
}


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
$("#container").bind("mousedown",(e)=>{
  screen.selectX = Math.round((e.pageX - screen.offsetX)/screen.unitSize);
  screen.selectY = Math.round((e.pageY - screen.offsetY)/screen.unitSize);
  location.hash=`${screen.selectX},${screen.selectY}`;
  $("#position").html(`X: ${screen.selectX}, Y: ${screen.selectY}`);
  var startX=e.pageX;
  var startY=e.pageY;
  var tmpOffsetX = screen.offsetX;
  var tmpOffsetY = screen.offsetY;
  screen.selectRectCanvas.update()
  $("#container").bind("mousemove",(es)=>{
    screen.offsetX = es.pageX - startX + tmpOffsetX
    screen.offsetY = es.pageY - startY + tmpOffsetY
    screen.two.update()
    screen.selectRectCanvas.update()
  });
})
$("#container").bind("mouseup",(e)=>$("#container").unbind("mousemove"))

if(screen.two.type != "SVGRenderer"){
  $(window).bind("resize",()=>{
    screen.two.update()
    screen.selectRectCanvas.update()
  })
}
//一些键盘操作
$(window).bind("keydown",function(e) {
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
$("#button").bind("click",()=>screen.colorIt())
$("#clear").bind("click",()=>screen.clearCanvas())

//人性化响应

$("#color").bind("change",()=>$("#color").blur())
