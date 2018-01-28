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
    .option("queryMax",{
      default: 100,
      type: "number",
      describe: "max query cell number"
    })
    .option("addMax",{
      default: 100,
      type: "number",
      describe: "max add point number"
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

  var assert = require('assert')

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
        if(data.length!=0){
          if(isNum(data[0].time)){//Query {x1,y1,x2,y2,time} => {x1,y1,x2,y2,time,data} | [{x,y,time},...] => [{x,y,time,data},...]
            for(var i of data){
              assert(isNum(i.x,i.y,i.time))
            }
            ws.refreshTime = Date.now()
            TreeNode.query(data).then((res)=>{
              ws.send(JSON.stringify(res))
              //console.log(res)
            })
          }else if(isNum(data[0].t)){//add point {x,y,r,g,b,t} | [{x,y,r,g,b,t},...]
            //console.log(data)
            for(var i of data){
              assert(isNum(i.x,i.y,i.r,i.g,i.b,i.t))
            }
            var time = Date.now()
            if(Math.abs(time-data.t)>timeerr){
              throw "Error Time"
            }
            ws.refreshTime = time
            TreeNode.addPoints(data)
            var toSend = JSON.stringify(data);
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
