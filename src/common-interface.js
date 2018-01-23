var edgeSize = 128;

class TimeLine{
  constructor(){
    this.data = [];//Array(edgeSize*edgeSize*2);
    this.inited = false;
  }
  async __addPoint(point, color, time){
    this.dataModified = [];
    this.data.push({x:point.x, y:point.y, r:color.r, g:color.g, b:color.b, t:time, abandoned:false});
    for(var i=0;i<this.data.length-1;i++){
      if(this.data[i] && this.data[i].x==point.x && this.data[i].y==point.y){
        this.data[i] = {abandoned: true};
        this.dataModified.push(i);
      }
    }
    await this.save_point();
  }
  async __query(time=0){
    var res = [];
    for(var i=this.data.length-1;i>=0;i--){
      if(this.data[i].abandoned){
        continue;
      }
      res.push(this.data[i]);
      if(this.data[i].t<=time){
        break;
      }
    }
    return res
  }
  async fresh(){
    await this.init()
    var tmpData = [];
    for(var i of this.data){
      if(i.abandoned){
        continue;
      }
      tmpData.push(i);
    }
    delete this.data;
    this.data = tmpData
    await this.save_fresh()
  }
  async init(){//load data
    if(this.inited){
      return
    }
    this.inited = true;
  }
  async save_node(){//change info
  }
  async save_point(){//change some data
  }
  async save_fresh(){//change all data
  }
}

class TreeNode extends TimeLine{
  constructor(x1, y1, x2, y2, father, collection){
    // id? x1 y1 x2 y2 leftSon rightSon father flag data top
    super();
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
    this.leftSon = null;
    this.rightSon = null;
    this.father = father;
    this.flag = (x2 - x1)<=edgeSize-1 && (y2 - y1)<=edgeSize-1 // True if it is unit
    this.collection = collection;
    //this.tree = tree;
    //tree.push(this);/// ??? 需要节点列表么?
  }
  format(){
    return `node x1:${this.x1}, x2:${this.x2}, y1:${this.y1}, y2:${this.y2}`
  }
  show(){
    console.log(this.format())
  }
  whetherInclude(point){
    return this.x1<=point.x && point.x<=this.x2 && this.y1<=point.y && point.y<=this.y2;
  }
  async split(){// not called by leaf
    if(this.flag || this.leftSon){
      return;
    }
    //console.log(`split x1:${this.x1}, x2:${this.x2}, y1:${this.y1}, y2:${this.y2}`)
    var x1 = this.x1, x2 = this.x2, y1 = this.y1, y2 = this.y2;
    if((x2-x1)==(y2-y1)){//  True: -- False: --
      this.leftSon = this.leftSon || new this.constructor(x1, y1, x2, (y1+y2+1)/2-1, this, this.collection);
      this.rightSon = this.rightSon || new this.constructor(x1, (y1+y2+1)/2, x2, y2, this, this.collection);
    }else{
      this.leftSon = this.leftSon || new this.constructor(x1, y1, (x1+x2+1)/2-1, y2, this, this.collection);
      this.rightSon = this.rightSon || new this.constructor((x1+x2+1)/2, y1, x2, y2, this, this.collection);
    }
    await Promise.all([this.leftSon.init(),this.rightSon.init()]);
    await this.save_node();
  }
  async extend(){//only called by root node
    if(this.father){
      return;
    }
    //console.log(`extend x1:${this.x1}, x2:${this.x2}, y1:${this.y1}, y2:${this.y2}`)
    var x1 = this.x1, x2 = this.x2, y1 = this.y1, y2 = this.y2;
    if((x2-x1)==(y2-y1)){
      if(x2+x1>0){
        //left;
        this.father = new this.constructor(2*x1-x2-1, y1, x2, y2, null, this.collection);
        this.father.leftSon = this;
        this.father.rightSon = new this.constructor(2*x1-x2-1, y1, x1-1, y2, this.father, this.collection);
      }else{
        //right
        this.father = new this.constructor(x1, y1, 2*x2-x1+1, y2, null, this.collection);
        this.father.leftSon = this;
        this.father.rightSon = new this.constructor(x2+1, y1, 2*x2-x1+1, y2, this.father, this.collection);
      }
    }else{
      if(y2+y1>0){
        //bottom
        this.father = new this.constructor(x1, 2*y1-y2-1, x2, y2, null, this.collection);
        this.father.leftSon = this;
        this.father.rightSon = new this.constructor(x1, 2*y1-y2-1, x2, y1-1, this.father, this.collection);
      }else{
        //top
        this.father = new this.constructor(x1, y1, x2, 2*y2-y1+1, null, this.collection);
        this.father.leftSon = this;
        this.father.rightSon = new this.constructor(x1, y2+1, x2, 2*y2-y1+1, this.father, this.collection);
      }
    }
    await Promise.all([this.father.init(),this.father.rightSon.init()]);
    await Promise.all([this.save_node(),this.father.save_node(),this.father.rightSon.save_node()])
  }
  async _addPoint(point, color, time){
    await this.init()
    if(this.flag){
      await this.__addPoint(point, color, time);
    }else{
      await this.split();
      if(this.leftSon.whetherInclude(point)){
        await this.leftSon._addPoint(point, color, time);
      }else{
        await this.rightSon._addPoint(point, color, time);
      }
    }
  }
  async addPoint(point, color, time){//only called by root node
    await this.init()
    if(this.father){
      await this.father.addPoint(point, color, time);
    }else{
      if(this.whetherInclude(point)){
        await this._addPoint(point, color, time);
      }else{
        await this.extend();
        await this.father.addPoint(point, color, time);
      }
    }
  }
  whetherOverlap(x1, y1, x2, y2){
    var flag = false;
    flag |= this.whetherInclude({x:x1, y:y1});
    flag |= this.whetherInclude({x:x1, y:y2});
    flag |= this.whetherInclude({x:x2, y:y1});
    flag |= this.whetherInclude({x:x2, y:y2});
    return flag;
  }
  async _query(x1, y1, x2, y2, time){
    await this.init()
    if(!this.whetherOverlap(x1, y1, x2, y2)){//不在的话
      return [];
    }else if(this.flag){//子叶的话
      return await this.__query(time);
    }else{
      var [a, b] = await Promise.all([this.leftSon._query(x1 ,y1, x2, y2, time), this.rightSon._query(x1 ,y1, x2, y2, time)]);
      return a.concat(b);
    }
  }
  async query(x1, y1, x2, y2, time){//only called by root node
    await this.init()
    if(this.father){
      return await this.father.query(x1, y1, x2, y2, time);
    }else{
      return await this._query(x1, y1, x2, y2, time);
    }
  }
  async findAncestor(){
    if(!this.father){
      return this;
    }else{
      return await this.father.findAncestor();
    }
  }
}

function createTree(type, col){
  return new type(-edgeSize/2,-edgeSize/2,edgeSize/2-1,edgeSize/2-1,null,col);
}


var isNode = false;
if (typeof process === 'object') {
  if (typeof process.versions === 'object') {
    if (typeof process.versions.node !== 'undefined') {
      isNode = true;
    }
  }
}

if(isNode){
  module.exports = {
    edgeSize,
    TreeNode,
    createTree
  }
}
