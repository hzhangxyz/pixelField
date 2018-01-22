var edgeSize = 128;

class TimeLine{
  constructor(){
    this.data = [];//Array(edgeSize*edgeSize*2);
    this.top = 0;
  }
  async __addPoint(point, color, time){
    this.dataModified = [];
    this.data.push({x:point.x, y:point.y, r:color.r, g:color.g, b:color.b, t:time, abandoned:false});
    for(var i=0;i<this.top;i++){
      if(this.data[i] && this.data[i].x==point.x && this.data[i].y==point.y){
        this.data[i] = {abandoned: true};
        this.dataModified.push(i);
      }
    }
    this.top++;
  }
  async __query(time){
    var res = [];
    for(var i=this.top-1;i>=0;i--){
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
    var newTop=0;
    var tmpData = [];
    for(var oldTop=0;oldTop<this.top;oldTop++){
      if(this.data[oldTop].abandoned){
        delete this.data[oldTop]
        continue;
      }
      tmpdata[newTop++] = this.data[oldTop];
    }
    this.top = newTop;
    delete this.data;
    this.data = tmpData
  }
}

class TreeNode extends TimeLine{
  constructor(x1, y1, x2, y2, father){
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
    this.collection = null;
  }
  async init(n){
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
    this.notSplited = true;
    if(this.flag || this.leftSon){
      return;
    }
    //console.log(`split x1:${this.x1}, x2:${this.x2}, y1:${this.y1}, y2:${this.y2}`)
    this.notSplited = false;
    var x1 = this.x1, x2 = this.x2, y1 = this.y1, y2 = this.y2;
    if((x2-x1)==(y2-y1)){//  True: -- False: --
      this.leftSon = this.leftSon || new this.constructor(x1, y1, x2, (y1+y2+1)/2-1, this);
      this.rightSon = this.rightSon || new this.constructor(x1, (y1+y2+1)/2, x2, y2, this);
    }else{
      this.leftSon = this.leftSon || new this.constructor(x1, y1, (x1+x2+1)/2-1, y2, this);
      this.rightSon = this.rightSon || new this.constructor((x1+x2+1)/2, y1, x2, y2, this);
    }
    await [this.leftSon.init(this.collection),
      this.rightSon.init(this.collection)];
  }
  async extend(){//only called by root node
    this.notExtended = true;
    if(this.father){
      return;
    }
    //console.log(`extend x1:${this.x1}, x2:${this.x2}, y1:${this.y1}, y2:${this.y2}`)
    this.notExtended = false;
    var x1 = this.x1, x2 = this.x2, y1 = this.y1, y2 = this.y2;
    if((x2-x1)==(y2-y1)){
      if(x2+x1>0){
        //left;
        this.father = new this.constructor(2*x1-x2-1, y1, x2, y2, null);
        this.father.leftSon = this;
        this.father.rightSon = new this.constructor(2*x1-x2-1, y1, x1-1, y2, this.father);
      }else{
        //right
        this.father = new this.constructor(x1, y1, 2*x2-x1+1, y2, null);
        this.father.leftSon = this;
        this.father.rightSon = new this.constructor(x2+1, y1, 2*x2-x1+1, y2, this.father);
      }
    }else{
      if(y2+y1>0){
        //bottom
        this.father = new this.constructor(x1, 2*y1-y2-1, x2, y2, null);
        this.father.leftSon = this;
        this.father.rightSon = new this.constructor(x1, 2*y1-y2-1, x2, y1-1, this.father);
      }else{
        //top
        this.father = new this.constructor(x1, y1, x2, 2*y2-y1+1, null);
        this.father.leftSon = this;
        this.father.rightSon = new this.constructor(x1, y2+1, x2, 2*y2-y1+1, this.father);
      }
    }
    await this.father.init(this.collection);
    await this.father.rightSon.init(this.collection);
  }
  async _addPoint(point, color, time){
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
    if(this.father){
      await this.father.addPoint();
    }else{
      if(this.whetherInclude(point)){
        await this._addPoint(point, color, time);
      }else{
        await this.extend();
        await this.father._addPoint(point, color, time);
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
  async query(x1, y1, x2, y2, time){//only called by root node
    if(this.father){
      return await this.father.query(x1, y1, x2, y2, time);
    }else{
      return await this._query(x1, y1, x2, y2, time);
    }
  }
  async _query(x1, y1, x2, y2, time){
    if(!this.whetherOverlap(x1, y1, x2, y2)){//不在的话
      return [];
    }else if(this.flag){//子叶的话
      return await this.__query(time);
    }else{
      return (await this.leftSon._query(x1 ,y1, x2, y2, time)).concat(
        await this.rightSon._query(x1 ,y1, x2, y2, time));
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

function createRoot(type){
  return new type(-edgeSize/2,-edgeSize/2,edgeSize/2-1,edgeSize/2-1,null);
}

module.exports={
  edgeSize,
  TreeNode,
  createRoot
}
