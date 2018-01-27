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
      //console.log(time)
      ws.send(JSON.stringify({time, x1, y1, x2, y2}));
    }
    // ws.query 与 tree.query 不一样
    ws.onopen=()=>{
      setInterval(()=>ws.send("{}"),30000)
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
    this.ws.onmessage = async function(evt) {//this is this.ws
      var num = 0;
      var recv = JSON.parse(evt.data)
      var times = [];
      for(var i of recv.data){
        this.screen.addPoints(i,"s")
        num += i.length
        if(i[0]){
          times.push(i[0].t)
        }
      }
      console.log("server",num)
      this.screen.two.update()
      if(times[0]!=0){
        await this.screen.tree.coverTime(recv.x1,recv.y1,recv.x2,recv.y2,Math.max(...times))
      }
    };
    await this.query()
    this.loaded(this.dotter);
    this.inited = true;
  }
  async query(){
    if(this.useServer){
      this.ws.query(...await this.getRange());
    }
    var data = await this.tree.query(...await this.getRange());
    var num = 0
    for(var i of data){
      this.addPoints(i,"l");
      num += i.length
    }
    this.two.update();
    console.log("local",num)
  }
  async getRange(){
    var w = this.two.width/this.unitSize;
    var h = this.two.height/this.unitSize;
    var x = -this.offsetX/this.unitSize;
    var y = -this.offsetY/this.unitSize;
    var c = this.cacheParam
    var res = [ x - c*w, y - c*h, x + (1+c)*w, y + (1+c)*h]
    var t = await this.tree.queryTime(...res)
    return [...res,t]
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

