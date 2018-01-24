var MongoClient = require('mongodb').MongoClient;
var commonInterface = require("./common-interface.js");

var defaultUrl = 'mongodb://localhost:27017';
var defaultDbName = 'pixelField';

async function getCollection(url=defaultUrl, dbName=defaultDbName){
  var client = await MongoClient.connect(url);
  var db = client.db(dbName);
  var collection = db.collection('tree');
  return [collection,async ()=>await client.close()]
}

class MongodbTreeNode extends commonInterface.TreeNode{
  //constructor(x1, y1, x2, y2, father, col){
  //  super(x1, y1, x2, y2, father, col);
  //}
  async init(){
    if(this.inited){
      return;
    }
    if(this.id){
      var meta = await this.collection.findOne({_id:this.id});
      this.data = meta.data;
    }else{
      var res = await this.collection.insertOne({
        x1:this.x1,
        y1:this.y1,
        x2:this.x2,
        y2:this.y2,
        flag:this.flag,
        data:this.data,
        father:this.getId(this.father),
        leftSon:this.getId(this.leftSon),
        rightSon:this.getId(this.rightSon)
      });
      this.id = res.ops[0]._id;
    }
    this.inited = true;
  }
  async disinit(){
    delete this.data;
    this.data = [];
    this.inited = false;
  }
  getId(node){
    if(node){
      if(node.id){
        return node.id;
      }else{
        return null;
      }
    }else{
      return null;
    }
  }
  async save_node(){
    //fresh father and son
    await this.collection.updateOne({_id:this.id},{
      $set:{
        father:this.getId(this.father),
        leftSon:this.getId(this.leftSon),
        rightSon:this.getId(this.rightSon)
      }
    });
  }
  timeLinePointConverter(i, notFresh=true){
    if(this.data[i].abandoned && notFresh){
      return {abandoned:true};
    }else{
      return{
        x:this.data[i].x,
        y:this.data[i].y,
        r:this.data[i].r,
        g:this.data[i].g,
        b:this.data[i].b,
        t:this.data[i].t,
        abandoned:this.data[i].abandoned
      };
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
      await this.collection.updateOne({_id:this.id},{
        $set: setter
      });
    }
    await this.collection.updateOne({_id:this.id},{
      $push: {
        data: this.timeLinePointConverter(this.data.length-1)
      }
    });
  }
  async save_fresh(){
    //fresh all data
    //var data = [];
    //for(var i=0;i<this.top;i++){
    //  data.push(this.timeLinePointConverter(i,false));
    //}
    //await this.collection.updateOne({_id:this.id},{
    //  $set: {
    //    data,
    //    top: this.top
    //  }
    //})
    await this.collection.updateOne({_id:this.id},{
      $pull: {data: {abandoned: true}}
    },
      {multi: true});
  }
  async freshAll(){
    await this.collection.update({},
      {$pull: {data: {abandoned: true}}},
      {multi: true});// 改变top...
    await this._freshAll();
  }
  async _freshAll(){
    if(this.father){
      await this.father._freshAll();
    }else{
      await this.__freshAll();
    }
  }
  async __freshAll(){
    if(this.leftSon){
      var a = this.leftSon.__freshAll();
    }
    if(this.rightSon){
      var b = this.rightSon.__freshAll();
    }
    await this.disinit();
    await this.init();
    if(this.leftSon){
      await a;
    }
    if(this.rightSon){
      await b;
    }
  }
}

async function recovery(col, id){
  var meta = await col.find({},{projection:{data:0}}).toArray();
  var dict = {}
  var pool = meta.map((i)=>{
    var node = new MongodbTreeNode(i.x1, i.y1, i.x2, i.y2, null, col);
    node.id = i._id;
    node._father = i.father;
    node._leftSon = i.leftSon;
    node._rightSon = i.rightSon;
    dict[node.id] = node;
    return node;
  })
  for(var i of pool){
    if(i._father){
      i.father = dict[i._father];
    }
    if(i._leftSon){
      i.leftSon = dict[i._leftSon];
    }
    if(i._rightSon){
      i.rightSon = dict[i._rightSon];
    }
    delete i._father;
    delete i._leftSon;
    delete i._rightSon;
  }
  if(pool.length==0){
    return null;
  }else{
    if(id){
      for(var i of pool){
        if(i.id == id){
          return await i.findAncestor();
        }
      }
      return null;
    }else{
    return await pool[0].findAncestor();
    }
  }
}

module.exports = {
  getCollection,
  recovery,
  MongodbTreeNode,
  edgeSize: commonInterface.edgeSize,
  createTree: commonInterface.createTree
}
