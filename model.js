"use strict"
require("babel-polyfill")

function getTreeNode(arg){
  var mongoose = require('mongoose');

  if(!arg){
    arg = {}
  }

  var edgeSize = arg.edgeSize || 128;
  var queryMax = arg.queryMax || 100;
  var addMax = arg.addMax || 100;
  var savePeriod = arg.savePeriod || 10000;
  var keepAliveTime = arg.keepAliveTime || 1000;
  var url = arg.url || "mongodb://localhost:27017/pixelField"
  var collectionName = arg.collectionName || "tree"

  var treeSchema = new mongoose.Schema({
    // save x*edgeSize (1+x)*edgeSize, y ... info
    x: {
      type: Number,
      required: true,
      integer: true
    },
    y: {
      type: Number,
      required: true,
      integer: true
    },
    d: {
      type: [{
        x: {type: Number,required: true, integer:true},
        y: {type: Number,required: true, integer:true},
        r: {type: Number,required: true, integer:true, min:0, max:255},
        g: {type: Number,required: true, integer:true, min:0, max:255},
        b: {type: Number,required: true, integer:true, min:0, max:255},
        t: {type: Date,default: Date.now,required: true}
      }],
      default: Array,
      alias: "data"
    },
  });
  treeSchema.index({x:1,y:1},{unique:true})
  treeSchema.statics.getTree = async function(x,y,create=true){
    x = Math.floor(x)
    y = Math.floor(y)
    if(isNaN(x) || isNaN(y) || !Number.isFinite(x) || !Number.isFinite(y)){
      throw "Number Error"
    }
    if(typeof this.world == "undefined"){
      this.world = new Object()
    }
    if(typeof this.world[x] == "undefined"){
      this.world[x] = new Object()
    }
    if(typeof this.world[x][y] == "undefined"){
      var res = await this.findOne({x,y}).exec()
      if(!res && create){
        res = new TreeNode({x,y})
      }
      if(!res){
        return null;
      }
      res.tmpData = []
      this.world[x][y] = res;
      return res;
    }else{
      return this.world[x][y]
    }
  };
  treeSchema.statics.addPoints = async function(data){
    if(data.length > addMax){
      return
    }
    for(var i of data){
      try{
        var tree = await this.getTree(i.x/edgeSize,i.y/edgeSize)
        tree.tmpData.push({x:i.x,y:i.y,r:i.r,g:i.g,b:i.b,t:Date.now()});
        tree.saveDataWrapper();
      }catch(e){
        console.log(e)
      }
    }
  };
  treeSchema.statics.queryOne = async function(x,y,t){
    var tree = await this.getTree(x,y,false);
    var res = [];
    var resTime = t;
    if(tree){
      var time = new Date(t);
      for(var i of tree.data){
        if(time<i.t){
          var ts = (new Date(i.t)).getTime()
          res.push({x:i.x,y:i.y,r:i.r,g:i.g,b:i.b,t:ts})
          if(resTime<ts){
            resTime = ts
          }
        }
      }
      for(var i of tree.tmpData){
        if(time<i.t){
          var ts = (new Date(i.t)).getTime()
          res.push({x:i.x,y:i.y,r:i.r,g:i.g,b:i.b,t:ts})
          if(resTime<ts){
            resTime = ts
          }
        }
      }
    }
    return {x,y,data:res,time:resTime}
  }
  treeSchema.statics.query = async function(queryList){
    if(queryList.length > queryMax){
      return []
    }
    var meta = [];
    for(var i of queryList){
        meta.push(this.queryOne(i.x,i.y,i.time))
    }
    var data = await Promise.all(meta)
    return data
  };
  treeSchema.statics.dropData = function(){
    this.collection.drop();
    this.world = new Object();
  }
  treeSchema.statics.saveAll = async function(){
    var meta = []
    for(var i of Object.values(this.world)){
      for(var j of Object.values(i)){
        meta.push(j.save());
      }
    }
    await Promise.all(meta);
  }
  treeSchema.methods.saveDataWrapper = function(){
    if(this.saveFlag){
      return;
    }
    this.saveFlag = 1
    setTimeout(()=>{this.saveData()},savePeriod);
  }
  treeSchema.methods.saveData = async function(){
    while(this.saveLock){
      await sleep(savePeriod)
    }
    this.saveLock = 1
    delete this.saveFlag

    var preTmp = this.tmpData;
    this.tmpData = []

    var tmp = []
    for(var i=0;i<preTmp.length;i++){
      var flag = true
      for(var j=i+1;j<preTmp.length;j++){
        if(preTmp[i].x == preTmp[j].x && preTmp[i].y == preTmp[j].y){
          flag = false;
          break
        }
      }
      if(flag){
        tmp.push(preTmp[i])
      }
    }
    var preRes = []
    for(var i of this.data){
      var flag = true
      for(var j of tmp){
        if(i.x == j.x && i.y == j.y){
          flag = false;
          break
        }
      }
      if(flag){
        preRes.push(i)
      }
    }
    var res = preRes.concat(tmp)
    this.data = res;
    await this.save()
    delete this.saveLock
  }

  var db = mongoose.createConnection(url,{keepAlive: 1000})
  var TreeNode = db.model(collectionName,treeSchema,collectionName);

  return TreeNode
}

module.exports = {
  getTreeNode
}

/*
 * TreeNode.dropData()
 * await TreeNode.saveAll()
 *
 * await TreeNode.addPoints([{x,y,r,g,b,t},{}...])
 * await TreeNode.query(x1,y1,x2,y2,t)
 *   => [[{},{}...],[{},{}...]...] 且逆向覆盖形式的有效
 *
 */
