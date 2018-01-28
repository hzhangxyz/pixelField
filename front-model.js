"use strict"

function getTreeNode(arg){
  if(!arg){
    arg = {}
  }
  var edgeSize = arg.edgeSize || 128
  var TreeNode = arg.local || localforage;
  var savePeriod = arg.savePeriod || 1000

  function sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
  }

  TreeNode.dropData = TreeNode.clear;
  TreeNode.tmp = {}
  TreeNode.lock = {}
  TreeNode.flag = {}

  TreeNode.getTreeName = function(x,y){
    return `${x}_${y}`
  }
  TreeNode.getTreeTimeName = function(x,y){
    return `T${x}_${y}`
  }

  TreeNode.setTreeTime = async function(x,y,t){
    await this.setItem(this.getTreeTimeName(x,y),t.toString())
  }
  TreeNode.getTreeTime = async function(x,y){
    var res = await this.getItem(this.getTreeTimeName(x,y))
    //console.log(x,y,res)
    if(res){
      return {x,y,time:parseInt(res)};
    }else{
      return {x,y,time:0};
    }
  }
  TreeNode.queryTime = async function(x1,y1,x2,y2){
    var xs = Math.floor(x1/edgeSize)
    var xe = Math.floor(x2/edgeSize)
    var ys = Math.floor(y1/edgeSize)
    var ye = Math.floor(y2/edgeSize)
    var meta = [];
    for(var x=xs;x<=xe;x++){
      for(var y=ys;y<=ye;y++){
        meta.push(this.getTreeTime(x,y))
      }
    }
    return await Promise.all(meta)
  }

  TreeNode.query = async function(queryList){
    var meta = []
    for(var i of queryList){
      var name = this.getTreeName(i.x,i.y)
      if(typeof this.queried == "undefined"){
        this.queried = new Set()
      }
      if(!this.queried.has(name)){
        meta.push(this.queryOne(name))
        this.queried.add(name)
      }
    }
    return await Promise.all(meta)
  }
  TreeNode.queryOne = async function(key){
    var res = await this.getItem(key)
    if(res){
      return JSON.parse(res)
    }else{
      return []
    }
  }
  TreeNode.addPoints = function(data){
    var meta = []
    for(var i of data){
      var x = Math.floor(i.x/edgeSize)
      var y = Math.floor(i.y/edgeSize)
      var keyName = this.getTreeName(x,y)
      i.t = (new Date(i.t)).getTime()
      if(i._id){
        delete i._id
      }
      if(typeof this.tmp[keyName] == "undefined"){
        this.tmp[keyName] = [i]
      }else{
        this.tmp[keyName].push(i)
      }
      if(!this.flag[keyName]){
        this.flag[keyName] = 1
        setTimeout(()=>this.addPointsOne(keyName),savePeriod)
      }
    }
  }
  TreeNode.addPointsOne = async function(key){
    while(this.lock[key]){
      await sleep(savePeriod)
    }

    this.lock[key] = 1
    delete this.flag[key]
    var preTmp = this.tmp[key]
    delete this.tmp[key]
    var preTree = this.getItem(key)

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
    var tree = await preTree
    if(tree){
      tree = JSON.parse(tree)
    }else{
      tree = []
    }
    var newTree = []
    for(var i of tree){
      var flag = true
      for(var j of tmp){
        if(i.x == j.x && i.y == j.y){
          flag = false;
          break
        }
      }
      if(flag){
        newTree.push(i)
      }
    }
    var res = JSON.stringify(newTree.concat(tmp))
    await this.setItem(key,res)

    delete this.lock[key]
  }

  return TreeNode
}
