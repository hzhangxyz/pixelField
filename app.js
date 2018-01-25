function main(){

  var express = require("express")
  var app = express()
  var expressWs = require("express-ws")(app);
  var TreeNode = require("./model.js").getTreeNode({
    url: process.argv[2]
    modelName: process.argv[3]
  })

  var timeout = 600000;
  var timeerr = 30*60*60*1000;

  app.get('/', (req, res)=>{res.sendFile("index.html",{root: __dirname})})
  app.get('/common-interface.js', (req, res)=>{res.sendFile("common-interface.js",{root: __dirname})})
  app.get('/local-storage-interface.js', (req, res)=>{res.sendFile("local-storage-interface.js",{root: __dirname})})
  app.get('/render.js', (req, res)=>{res.sendFile("render.js",{root: __dirname})})

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
    ws.on('close', function(){
      wsList.delete(ws)
    })
    ws.on('message', function(msg){
      try{
        var data = JSON.parse(msg);
        //console.log(data)
        if(isNum(data.time)){//Query
          if(isNum(data.x1,data.y1,data.x2,data.y2,data.time)){
            ws.refreshTime = Date.now()
            TreeNode.query(data.x1,data.y1,data.x2,data.y2,data.time).then((res)=>{
              ws.send(JSON.stringify(res))
              //console.log(res)
            })
          }else{
            throw "Error Format"
          }
        }else{
          //console.log(data)
          if(isNum(data.x,data.y,data.r,data.g,data.b,data.t)){
            var time = Date.now()
            if(Math.abs(time-data.t)>timeerr){
              throw "Error Time"
            }
            ws.refreshTime = time
            TreeNode.addPoints([data])
            var toSend = JSON.stringify([data]);
            for(var i of wsList){
              if(i==ws){
                continue
              }
              try{
                if(time - i.refreshTime > timeout){
                  throw "Timeout"
                }else{
                  i.send(toSend);
                  //console.log(toSend)
                }
              }catch(e){
                console.log(e)
                i.close();
              }
            }
          }else{
            throw "Error Format"
          }
        }
      }catch(e){
        console.log(e)
        ws.close()
      }
    });
  });
  app.listen(3000, () => console.log('Example app listening on port 3000!'))
}
