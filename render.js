// 准备画布
var dotter = setInterval(()=>{$("#dots").append(".")},50);
var two = new Two({
  fullscreen: true,
  type: Two.Types.svg,
  // autostart: true
}).appendTo(document.getElementById("container"));


var unitSize = 10;
var cacheParam = 2
var offsetX = two.width/2;
var offsetY = two.height/2;

var tmpOffsetX = 0;
var tmpOffsetY = 0;
var startX = 0;
var startY = 0;
var selectX = 0;
var selectY = 0;

var ws = null;
var tree = null;

var useServer = true;

// 读取url中信息
if(location.search.length>1){
  unitSize = parseInt(location.search.substr(1))
}
if(location.hash.length>1){
  [selectX, selectY] = location.hash.substr(1).split(",").map((n)=>parseInt(n))
  offsetX -= selectX*unitSize
  offsetY -= selectY*unitSize
}

// 更新画布位置
var group = two.makeGroup();
var selectRect = two.makeRectangle(0, 0, unitSize, unitSize);
selectRect.fill = "rgba(256, 0, 0, 0)";

two.bind('update',()=>{
  group.translation.set(offsetX, offsetY);
  //var oldSelectRect = selectRect;
  //selectRect.fill = "rgba(256, 0, 0, 0)";
  selectRect.translation.set(selectX*unitSize+offsetX, selectY*unitSize+offsetY);
  //oldSelectRect.remove();
})

// 更新画布内容
function createPoint(x, y, r, g, b){
  var rect = two.makeRectangle(x*unitSize, y*unitSize, unitSize, unitSize);
  rect.fill = `rgb(${r},${g},${b})`
  rect.noStroke()
  group.add(rect)
}

function getRange(){
  var w = two.width/unitSize;
  var h = two.height/unitSize;
  var x = -offsetX/unitSize;
  var y = -offsetY/unitSize;
  var res = [ x - cacheParam*w, y - cacheParam*h, x + (1+cacheParam)*w, y + (1+cacheParam)*h ]
  return res
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function freshCanvas(){// local => svg
  if(!tree){
    console.log("Read From Storage")
    tree = await recovery(localStorage);
    if(!tree){
      tree = createTree(LocalStorageTreeNode,localStorage);
    }
  }
  var l = tree.query(...getRange());
  var g = group.children.map((n)=>n)
  for(var i of await l){
    createPoint(i.x,i.y,i.r,i.g,i.b);
  }
  g.map((n)=>n.remove());
  two.update()
  //await sleep(2000)
}

//拖动的时候...

$("#position").html(`X: ${selectX}, Y: ${selectY}`);
$("#container").bind("mousedown",function(e){
  selectX = Math.round((e.pageX - offsetX)/unitSize);
  selectY = Math.round((e.pageY - offsetY)/unitSize);
  location.hash=`${selectX},${selectY}`;
  $("#position").html(`X: ${selectX}, Y: ${selectY}`);
  startX=e.pageX;
  startY=e.pageY;
  tmpOffsetX = offsetX;
  tmpOffsetY = offsetY;
  two.update()
  $("#container").bind("mousemove",function(es){
    offsetX = es.pageX - startX + tmpOffsetX
    offsetY = es.pageY - startY + tmpOffsetY
    two.update()
  });
})
$("#container").bind("mouseup",function(e){
  $("#container").unbind("mousemove")
})

//一些键盘操作
$("#container").bind("keydown",function(e) {
  switch(e.keyCode){
    case 32://空格
      colorIt()
      break;
    case 37://left
      selectX -= 1;
      break;
    case 38://up
      selectY -= 1;
      break;
    case 39://right
      selectX += 1;
      break;
    case 40://down
      selectY += 1;
      break;
  }
  $("#position").html(`X: ${selectX}, Y: ${selectY}`);
  two.update()
});

//color it
$("#button").click(colorIt)
$("#clear").click(clearCanvas)

function clearCanvas(){
  clearData(localStorage);
  tree = createTree(LocalStorageTreeNode,localStorage);
  freshCanvas()
}

async function colorIt(){
  var color = $("#color").val();
  //tree.addPoint
  var param = [{x:selectX,y:selectY},{
    r:parseInt(color.substr(1,2),16),
    g:parseInt(color.substr(3,2),16),
    b:parseInt(color.substr(5,2),16)
  },Date.now()];
  if(useServer){
    ws.send(JSON.stringify(param))
  }
  await tree.addPoint(...param);
  await freshCanvas()
}

//来自服务器的更新

function queryFromServer(){
  var ranger = getRange();
  ws.send(JSON.stringify({time: 0, x1:ranger[0], y1:ranger[1], x2:ranger[2], y2:ranger[3]}));
  // time ???????????????????
}

function loaded(){
  $("#loaded").css("display","block")
  $("#loading").css("display","none")
  clearInterval(dotter)
  $("#container").focus()
  $("#clear").css("display","none")
}

function loader(){
  var firstFresh = freshCanvas();

  ws = new WebSocket((location.origin+location.pathname).replace("http","ws"));

  ws.onclose = function(evt) {
    console.log('Connection closed.');
    firstFresh.then(loaded)
    useServer = false;
    $("#closed").html("Connection Closed");
    $("#clear").css("display","inline")
    //location.reload();
    //ws = new WebSocket(location.origin.replace("http","ws"));
  };

  ws.onmessage = function(evt) {
    //console.log(`receive ${evt.data}`)
    var l = []
    for(var i of JSON.parse(evt.data)){
      l.push(tree.addPoint({x:i.x,y:i.y},{r:i.r,g:i.g,b:i.b},i.t))
    }
    Promise.all(l).then(freshCanvas())
  };

  ws.onopen = function(evt) {
    console.log('Connection open ...');
    queryFromServer();

    firstFresh.then(loaded)
    //setInterval(()=>freshCanvas(),1000)
  };
}

loader()

