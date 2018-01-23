var MongoClient = require('mongodb').MongoClient;
var commonInterface = require("./common-interface.js");

var url = 'mongodb://localhost:27017';
var dbName = 'pixelField';

async function getCollection(){
  var client = await MongoClient.connect(url);
  var db = client.db(dbName);
  var collection = db.collection('tree');
  return [collection,async ()=>await client.close()]
}

class MongodbTreeNode extends commonInterface.TreeNode{
  constructor(x1, y1, x2, y2, father, tree, col){
    super(x1, y1, x2, y2, father, tree, col);
  }
  async init(){
    if(this.inited){
      return;
    }
    var res = await this.collection.insert({
      x1:this.x1,
      y1:this.y1,
      x2:this.x2,
      y2:this.y2,
      flag:this.flag,
      data:[],
      top:this.top,
      father:this.getId(this.father),
      leftSon:null,
      rightSon:null
    });
    this.id = res.ops[0]._id;
    this.inited = true;
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
      },
      $set: {
        top: this.top
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
        data,
        top: this.top
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
      this.save_node();
      this.notExtended = true;
    }
  }
}

// 注意:
// 偶尔对根进行findAncestor操作
// 清理时间轴即执行fresh操作
// TODOLIST
// 从数据库中读取
// 哪些await是可以等一会await的?

class ReadNode extends MongodbTreeNode{
  constructor(id, tree, col){ // !!!!!!!!!!
    if(arguments.length == 7){
      super(...arguments)
      return
    }
    for(var i of tree){
      if(i &&(id.equals(i.id))){
        return i
      }
    }
    super(0,0,0,0,null,tree, col)
    this.id = id;
  }
  async init(col){
    if(this.inited){
      return
    }
    //if(this.fromMem = true){
    //  await super.init();
    //  return
    //}
    this.collection = col;
    var meta = await this.collection.findOne({_id:this.id});
    this.x1 = meta.x1;
    this.y1 = meta.y1;
    this.x2 = meta.x2;
    this.y2 = meta.y2;
    this.data = meta.data;
    this.flag = meta.flag;
    this.top = meta.top;
    if(meta.father == null){
      this.father = null;
    }else{
      this.father = new ReadNode(meta.father, this.tree);
    }
    if(meta.leftSon == null){
      this.leftSon = null;
    }else{
      this.leftSon = new ReadNode(meta.leftSon, this.tree);
    }
    if(meta.rightSon == null){
      this.rightSon = null;
    }else{
      this.rightSon = new ReadNode(meta.rightSon, this.tree);
    }
    this.inited = true;
  }
}

module.exports = {
  getCollection,
  MongodbTreeNode,
  ReadNode,
  edgeSize: commonInterface.edgeSize,
  createTree: commonInterface.createTree
}
