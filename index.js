var keeper = require('./mongodb-interface.js')
var express = require('express')
var app = express()
var expressWs = require('express-ws')(app);

//var bodyParser = require('body-parser');
//app.use(bodyParser.json());
//app.use(bodyParser.urlencoded({extended:true}));

(async ()=>{
  var c = await keeper.getCollection();
  var tree = await keeper.recovery(c[0]);
  if(!tree){
    tree = keeper.createTree(keeper.MongodbTreeNode, c[0]);
  }
  return [tree, c[1]]
})().then((res)=>{

  var tree = res[0];
  process.on('exit',res[1])

  app.get('/', express.static('.'))
  app.get('/common-interface.js', express.static('.'))
  app.get('/local-storage-interface.js', express.static('.'))
  app.get('/render.js', express.static('.'))

  app.ws('/', function(ws, req) {
    ws.on('message', function(msg) {
      try{
        var data = JSON.parse(msg);
        if(typeof data.time != 'undefined'){//Query
          tree.query(data.x1,data.y1,data.x2,data.y2,data.time).then((res)=>{
            ws.send(JSON.stringify(res))
          })
        }else{
          tree.addPoint(data[0],data[1],Date.now())
          // send to other ????????????????????
        }
      }catch(e){
        console.log(e)
      }
    });
  });
  app.listen(3000, () => console.log('Example app listening on port 3000!'))
})
