async function getTree(){
  var tree = await recovery(localStorage);
  if(!tree){
    tree = createTree(LocalStorageTreeNode,localStorage);
  }
  return tree
}

function getWs(closeFunc){
  return new Promise((resolve)=>{
    var ws = new WebSocket((location.origin+location.pathname).replace("http","ws"));
    ws.onclose = closeFunc;
    ws.addPoint=async (...args)=>{
      //console.log(args)
      ws.send(JSON.stringify(args))
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
  constructor(){
    this.screen = this
    this.dotter = setInterval(()=>{$("#dots").append(".")},50);

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

    this.tree = getTree();

    this.ws = getWs(()=>{this.socketClose(),this.loaded()})

    this.unitSize = 10; // 一个点的大小
    this.cacheParam = 2 // 预加载周围多大的范围
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
      console.log("server",JSON.parse(evt.data).length)
      for(var i of JSON.parse(evt.data)){
        this.screen.addPoint({x:i.x,y:i.y},{r:i.r,g:i.g,b:i.b},i.t,"s")
      }
      this.screen.two.update()
    };
    await this.query()
    this.loaded();
    this.inited = true;
  }
  async query(){
    if(this.useServer){
      this.ws.query(...this.getRange(),0);
    }
    var data = await this.tree.query(...this.getRange(),0);
    console.log("local",data.length)
    for(var i of data){
      this.addPoint({x:i.x,y:i.y},{r:i.r,g:i.g,b:i.b},0,"l");
    }
    this.two.update();
    console.log("local loaded")
  }
  getRange(){
    var w = this.two.width/this.unitSize;
    var h = this.two.height/this.unitSize;
    var x = -this.offsetX/this.unitSize;
    var y = -this.offsetY/this.unitSize;
    var c = this.cacheParam
    var res = [ x - c*w, y - c*h, x + (1+c)*w, y + (1+c)*h ]
    return res
  }
  addPoint(p, c, t, f){
    if(f!="l"){
      this.tree.addPoint(...arguments)
      this.tree.findAncestor().then((res)=>this.tree=res)
    }
    if(f=="h" && this.useServer){
      this.ws.addPoint(...arguments)
    }

    var rect = this.two.makeRectangle(p.x*this.unitSize, p.y*this.unitSize, this.unitSize, this.unitSize);
    rect.fill = `rgb(${c.r},${c.g},${c.b})`
    rect.noStroke()
    this.group.add(rect)
  }
  fresh(){//this is this.two
    this.screen.group.translation.set(this.screen.offsetX, this.screen.offsetY);
  }
  freshRect(){
    this.screen.selectRect.translation.set(this.screen.selectX*this.screen.unitSize+this.screen.offsetX,
      this.screen.selectY*this.screen.unitSize+this.screen.offsetY);
  }
  loaded(){
    if(this.inited){
      return
    }
    $("#loaded").css("display","block")
    $("#loading").css("display","none")
    clearInterval(this.dotter)
    $("#clear").css("display","none")
  }
  socketClose(){
    console.log('Connection closed.');
    this.useServer = false;
    $("#closed").html("Connection Closed");
    $("#clear").css("display","inline")
    if(!this.inited){
      this.query()
    }
  }
  colorIt(){
    var color = $("#color").val();
    var param = [{x:this.selectX,y:this.selectY},{
      r:parseInt(color.substr(1,2),16),
      g:parseInt(color.substr(3,2),16),
      b:parseInt(color.substr(5,2),16)
    },Date.now()];
    this.addPoint(...param,"h");
    this.two.update()
  }
  clearCanvas(){//////////////
    clearData(localStorage);
    this.tree = createTree(LocalStorageTreeNode,localStorage);
    this.group.children.map((n)=>n).map((n)=>n.remove())
    this.two.update()
  }
}


// html 相关的

var screen =  new Screen();
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
    return;
  }
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
  $("#position").html(`X: ${screen.selectX}, Y: ${screen.selectY}`);
  if(e.ctrlKey){
    screen.two.update()
  }else{
    screen.selectRectCanvas.update()
  }
});

//color it
$("#button").bind("click",()=>screen.colorIt())
$("#clear").bind("click",()=>screen.clearCanvas())
