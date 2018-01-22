var MongoClient = require('mongodb').MongoClient;
var commonInterface = require("./common-interface.js");

var url = 'mongodb://localhost:27017';
var dbName = 'pixelField';

async function getCollection(){
  var client = await MongoClient.connect(url);
  var db = client.db(dbName);
  var collection = db.collection('tree');
  return [collection,async ()=>await client.close()]
  //var res = await collection.insertMany([{'a':4}]);
}

class MongodbTreeNode extends commonInterface.TreeNode{
  constructor(x1, y1, x2, y2, father){
    super(x1, y1, x2, y2, father);
  }
  async init(col){
    this.collection = col;
    var res = await this.collection.insert({
      x1:this.x1,
      y1:this.y1,
      x2:this.x2,
      y2:this.y2,
      flag:this.flag,
      data:[],
      top:this.top,
      father:"",
      leftSon:"",
      rightSon:""
    });
    this.id = res.ops[0]._id;
  }
  getId(node){
    if(node){
      return node.id;
    }else{
      return null;
    }
  }
  async save_node(){
    //fresh father and son
    await this.collection.update({_id:this.id},{
      $set:{
        father:this.getId(this.father),
        leftSon:this.getId(this.leftSon),
        rightSon:this.getId(this.rightSon)
      }
    })
  }
  timeLinePointConverter(i, notFresh=true){
    if(this.data[i].abandoned && notFresh){
      return {abandoned:true}
    }else{
      return{
        x:this.data[i].x,
        y:this.data[i].y,
        r:this.data[i].r,
        g:this.data[i].g,
        b:this.data[i].b,
        t:this.data[i].t,
        abandoned:this.data[i].abandoned
      }
    }
  }
  async save_point(){
    //read dataModified
    if(this.dataModified.length!=0){
      var setter = {};
      for(var i of this.dataModified){
        setter[`data.${i}`] = this.timeLinePointConverter(i);
      }
      this.dataModified = [];
      await this.collection.update({_id:this.id},{
        $set: setter
      });
    }
    await this.collection.update({_id:this.id},{
      $push: {
        data: this.timeLinePointConverter(this.top-1)
      }
    })
  }
  async save_fresh(){
    //fresh all data
    data = [];
    for(var i of this.dataModified){
      data.push(timeLinePointConverter(i,false));
    }
    await this.collection.update({_id:this.id},{
      $set: {
        data
      }
    })
  }
  async fresh(){
    super.fresh();
    await this.save_fresh();
  }
  async __addPoint(point, color, time){
    super.__addPoint(point, color, time);
    await this.save_point();
  }
  async split(){
    await super.split()
    if(!this.notSplited){
      this.save_node();
      this.notSplited = true;
    }
  }
  async extend(){
    await super.extend()
    if(!this.notExtended){
      this.father.save_node();
      this.save_node();
      this.notExtended = true;
    }
  }
}

async function test(){
  var c = await getCollection();
  var t = commonInterface.createRoot(MongodbTreeNode);
  await t.init(c[0])
  //await t.addPoint({x:0,y:0},{r:1,g:0,b:0},1)
  //await t.addPoint({x:2,y:0},{r:1,g:0,b:0},2)
  //await t.addPoint({x:2,y:0},{r:1,g:0,b:0},4)
  await t.addPoint({x:0,y:100},{r:2,g:0,b:0},2)
  await c[1]()
}

test().then((res)=>{
  console.log(`correct with ${res}`);
  process.exit(0);
}).catch((res)=>{
  console.log(`error with ${res}`);
  process.exit(1)
})
