var prefix = "Node_";
var prefixLength = prefix.length;


async function getCollection(){
  return localStorage;
}

class LocalStorageTreeNode extends TreeNode{
  async init(){
    if(this.inited){
      return;
    }
    if(this.id){
      this.data = JSON.parse(this.collection[this.id]).data;
    }else{
      this.id = `${prefix}${Math.random()}`;
      await this.save();
    }
    this.inited = true;
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
  async freshAll(){
    if(this.father){
      await this.father.freshAll();
    }else{
      await this._freshAll();
    }
  }
  async _freshAll(){
    if(this.leftSon){
      var a = this.leftSon._freshAll();
    }
    if(this.rightSon){
      var b = this.rightSon._freshAll();
    }
    await this.fresh();
    if(this.leftSon){
      await a;
    }
    if(this.rightSon){
      await b;
    }
  }
  async save_point(){
    await this.save();
  }
  async save_node(){
    await this.save();
  }
  async save_fresh(){
    await this.save();
  }
  async save(){
    this.collection[this.id]=JSON.stringify({
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
  }
}

async function recovery(col, id){
  var meta = {};
  for(var i in col){
    if(i.slice(0,prefixLength)==prefix){
      var tmp = JSON.parse(col[i]);
      meta[i] = new LocalStorageTreeNode(tmp.x1, tmp.y1, tmp.x2, tmp.y2, null, col);
      meta[i]._father = tmp.father;
      meta[i]._leftSon = tmp.leftSon;
      meta[i]._rightSon = tmp.rightSon;
      meta[i].id = i;
    }
  }
  for(var i in meta){
    if(meta[i]._father){
      meta[i].father = meta[meta[i]._father];
    }
    if(meta[i]._leftSon){
      meta[i].leftSon = meta[meta[i]._leftSon];
    }
    if(meta[i]._rightSon){
      meta[i].rightSon = meta[meta[i]._rightSon];
    }
    delete meta[i]._father;
    delete meta[i]._leftSon;
    delete meta[i]._rightSon;
  }
  var pool = Object.values(meta);
  if(pool.length==0){
    return null;
  }else{
    if(id){
      if(id in meta){
        return meta[i];
      }else{
        return null;
      }
    }else{
      return await pool[0].findAncestor();
    }
  }
}

async function clearData(col){
  col.clear();
}
