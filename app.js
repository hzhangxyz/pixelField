"use strict"
require("babel-polyfill")

function main(){

  var argv = require("yargs")
    .usage("$0 [args]")
    .option("port",{
      alias: "p",
      default: "4250",
      type: "number",
      describe: "port to listen"
    })
    .option("edgeSize",{
      default: 128,
      type: "number",
      describe: "unit cell size"
    })
    .option("edgeMax",{
      default: 2048,
      type: "number",
      describe: "max query size"
    })
    .option("savePeriod",{
      default: 1000,
      type: "number",
      describe: "interval to save"
    })
    .option("keepAliveTime",{
      default: 1000,
      type: "number",
      describe: "db keepalive"
    })
    .option("mongodb",{
      alias: ["d","url"],
      default: "mongodb://localhost:27017/pixelField",
    })
    .option("collection",{
      alias: ["c","collectionName"],
      default: "tree",
      describe: "collection name"
    })
    .option("timeOut",{
      alias: ["m","timeout"],
      type: "number",
      default: 600000,
      describe: "client timeout"
    })
    .option("timeErr",{
      alias: ["e","timeerr"],
      type: "number",
      default: 600000,
      describe: "C/S max time diff"
    })
    .version(false)
    .argv
  // edgeSize, edgeMax, savePeriod, keepAliveTime, url, collectionName

  var express = require("express")
  var app = express()
  var expressWs = require("express-ws")(app);

  var TreeNode = require("./model.js").getTreeNode(argv)

  var timeout = argv.timeout;
  var timeerr = argv.timeerr;

  app.get('/', (req, res)=>{res.sendFile("index.html",{root: __dirname})})
  app.get('/front-model.js', (req, res)=>{res.sendFile("front-model.js",{root: __dirname})})
  app.get('/front-screen.js', (req, res)=>{res.sendFile("front-screen.js",{root: __dirname})})
  app.get('/front-driver.js', (req, res)=>{res.sendFile("front-driver.js",{root: __dirname})})

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
        }else if(isNum(data.t)){//add point
          //console.log(data)
          if(isNum(data.x,data.y,data.r,data.g,data.b,data.t)){
            var time = Date.now()
            if(Math.abs(time-data.t)>timeerr){
              throw "Error Time"
            }
            ws.refreshTime = time
            TreeNode.addPoints([data])
            var toSend = JSON.stringify([[data]]);
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
  app.listen(argv.port, () => console.log(`App listening on port ${argv.port}!`))
}
// 与上一个版本的不同
// query 返回值 [] => [[]] 且倒序
// addpoint p,c,t => {x,y,r,g,b,t}

main()
