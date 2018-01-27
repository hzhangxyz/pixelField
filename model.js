"use strict"
require("babel-polyfill")

function getTreeNode(arg){
  var mongoose = require('mongoose');

  if(!arg){
    arg = {}
  }

  var edgeSize = arg.edgeSize || 128;
  var edgeMax = arg.edgeMax || 2048;
  var savePeriod = arg.savePeriod || 1000;
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
      this.world[x][y] = res;
      res.lastTop = res.data.length;
      return res;
    }else{
      return this.world[x][y]
    }
  };
  treeSchema.statics.addPoints = async function(data){
    for(var i of data){
      try{
        var tree = await this.getTree(i.x/edgeSize,i.y/edgeSize)
        tree.data.push(i);
        tree.saveData();
      }catch(e){
        console.log(e)
      }
    }
  };
  treeSchema.statics.queryOne = async function(x,y,t){
    var tree = await this.getTree(x,y,false);
    var res = [];
    if(tree){
      var time = new Date(t);
      for(var i=tree.data.length-1;i>=0;i--){
        if(time>=tree.data[i].t){
          break;
        }
        var tmp = tree.data[i]
        delete tmp._id
        tmp.t = (new Date(tmp.t)).getTime()
        res.push(tmp)
      }
    }
    return res
  }
  treeSchema.statics.query = async function(x1,y1,x2,y2,t){
    if(x2-x1 > edgeMax || y2-y1 > edgeMax){
      return []
    }
    var xs = Math.floor(x1/edgeSize)
    var xe = Math.floor(x2/edgeSize)
    var ys = Math.floor(y1/edgeSize)
    var ye = Math.floor(y2/edgeSize)
    var meta = [];
    for(var x=xs;x<=xe;x++){
      for(var y=ys;y<=ye;y++){
        meta.push(this.queryOne(x,y,t))
      }
    }
    var data = await Promise.all(meta)
    return data // [[{},{}...],[{},{}...]...] 且逆向覆盖形式的有效 
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
  treeSchema.methods.saveData = function(){
    if(this.saveHandle){
      return;
    }
    this.saveHandle = setTimeout(()=>{
      this.save()
      delete this.saveHandle
    },savePeriod);
  }
  treeSchema.pre("save",function(next){
    for(var i=this.data.length-1;i>=this.lastTop;i--){
      for(var j=0;j<i;j++){
        if(this.data[i].x == this.data[j].x && this.data[i].y == this.data[j].y){
          this.data.splice(j,1);
          i--;
          j--;
          if(j<this.lastTop){
            this.lastTop--;
          }
        }
      }
    }
    this.lastTop = this.data.length
    next()
  })

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
