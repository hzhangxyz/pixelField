"use strict"

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getTreeNode(arg){
  var edgeSize = arg.edgeSize || 128
  var TreeNode = arg.local || localforage;
  var savePeriod = arg.savePeriod || 1000

  TreeNode.dropData = TreeNode.clear;
  TreeNode.tmp = {}
  TreeNode.lock = {}
  TreeNode.flag = {}

  TreeNode.getTreeName = function(x,y){
    return `${x}_${y}`
  }
  TreeNode.query = async function(x1,y1,x2,y2){
    var xs = Math.floor(x1/edgeSize)
    var xe = Math.floor(x2/edgeSize)
    var ys = Math.floor(y1/edgeSize)
    var ye = Math.floor(y2/edgeSize)
    var meta = [];
    for(var x=xs;x<=xe;x++){
      for(var y=ys;y<ye;y++){
        meta.push(this.queryOne(this.getTreeName(x,y)))
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
      var x = Math.floor(i.x)
      var y = Math.floor(i.y)
      var keyName = `${x}_${y}`
      if(typeof tmp[keyName] == "undefined"){
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

    var preTree = this.getItem(key)
    var preTmp = this.tmp[key]
    delete this.tmp(key)
    var tmp = []
    for(var i=0;i<preTmp.length;i++){
      var flag = true
      for(var j=i+1;j<preTmp.length;j++){
        if(preTmp[i].x == preTmp[j].x && preTmp[i].x == preTmp[j].x){
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
        tree.push(i)
      }
    }
    var res = JSON.stringify(newTree.concat(tmp))
    await setItem(key,res)

    delete this.lock[key]
  }
}
