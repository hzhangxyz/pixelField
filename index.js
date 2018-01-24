var keeper = require('./mongodb-interface.js')
var path = require('path')
var express = require('express')
var app = express()
var expressWs = require('express-ws')(app);

var timeout = 600000;

(async ()=>{
  var c
  if(process.argv.length==4){
    c = await keeper.getCollection(process.argv[2],process.argv[3]);
  }else if(process.argv.length==3){
    c = await keeper.getCollection(process.argv[2]);
  }else{
    c = await keeper.getCollection();
  }
  var tree = await keeper.recovery(c[0]);
  if(!tree){
    tree = keeper.createTree(keeper.MongodbTreeNode, c[0]);
  }
  return [tree, c[1]]
})().then((res)=>{

  var tree = res[0];
  process.on('exit',res[1])

  app.get('/', (req, res)=>{
    res.sendFile("index.html",{
      root: __dirname
    })
  })

  var wsList = new Set([]);

  function isNum(){
    for(var i of arguments){
      if(typeof i != 'number'){
        return false;
      }
    }
    return true;
  }
  app.ws('/', function(ws, req) {
    ws.refreshTime = Date.now();
    wsList.add(ws);
    ws.on('message', function(msg) {
      try{
        var data = JSON.parse(msg);
        if(isNum(data.time)){//Query
          if(isNum(data.x1,data.y1,data.x2,data.y2,data.time)){
            ws.refreshTime = Date.now()
            tree.query(data.x1,data.y1,data.x2,data.y2,data.time).then((res)=>{
              ws.send(JSON.stringify(res))
            })
          }else{
            throw "Error Data"
          }
        }else{
          if(isNum(data[0].x,data[0].y,data[1].r,data[1].g,data[1].b,data[2])){
            ws.refreshTime = Date.now()
            var time = Date.now()
            tree.addPoint(data[0],data[1],time)
            var toSend = JSON.stringify([{x:data[0].x,y:data[0].y,r:data[1].r,g:data[1].g,b:data[1].b,t:time,abandoned:false}]);
            for(var i of wsList){
              try{
                if(time - i.refreshTime > timeout){
                  wsList.delete(i)
                  i.close()
                }else{
                  i.send(toSend);
                }
              }catch(e){
                console.log(e)
                wsList.delete(i);
                i.close();
              }
            }
          }else{
            throw "Error Data"
          }
        }
      }catch(e){
        console.log(e)
        wsList.delete(ws)
        ws.close()
      }
    });
  });
  app.listen(3000, () => console.log('Example app listening on port 3000!'))
})
