var edgeSize = 128;

var inNode = false;
if(this.global == this){
  inNode = True;
}

class TimeLine{
  constructor(){
    this.data = Array(edgeSize*edgeSize*2);
    this.top = 0;
  }
  __addPoint(point, color, time){
    this.data[this.top] = {x:point.x, y:point.y, r:color.r, g:color.g, b:color.b, t:time, abandoned:false};
    for(var i=0;i<this.top;i++){
      if(this.data[i] && this.data[i].x==point.x && this.data[i].y==point.y){
        this.data[i] = {abandoned: true};
      }
    }
    this.top++;
  }
  __query(time){
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
  fresh(){
    var newTop=0;
    for(var oldTop=0;oldTop<this.top;oldTop++){
      if(this.data[oldTop].abandoned){
        continue;
      }
      this.data[newTop++] = this.data[oldTop];
    }
    this.top = newTop;
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
    this.flag = (x2 - x1)==edgeSize-1 && (y2 - y1)==edgeSize-1 // True if it is unit
  }
  whetherInclude(point){
    return this.x1<=point.x && point.x<=this.x2 && this.y1<=point.y && point.y<=this.y2;
  }
  split(){// not called by leaf
    if(this.flag){
      return;
    }
    var x1 = this.x1, x2 = this.x2, y1 = this.y1, y2 = this.y2;
    if((x2-x1)==(y2-y1)){//  True: -- False: --
      this.leftSon = this.leftSon || new TreeNode(x1, y1, x2, (y1+y2+1)/2-1, this);
      this.rightSon = this.rightSon || new TreeNode(x1, (y1+y2+1)/2, x2, y2, this);
    }else{
      this.leftSon = this.leftSon || new TreeNode(x1, y1, (x1+x2+1)/2-1, y2, this);
      this.rightSon = this.rightSon || new TreeNode((x1+x2+1)/2, y1, x2, y2, this);
    }
  }
  extend(){//only called by root node
    if(this.father){
      return;
    }
    var x1 = this.x1, x2 = this.x2, y1 = this.y1, y2 = this.y2;
    if((x2-x1)==(y2-y1)){
      if(x2+x1>0){
        //left;
        this.father = new TreeNode(2*x1-x2-1, y1, x2, y2, null);
        this.father.leftSon = this;
      }else{
        //right
        this.father = new TreeNode(x1, y1, 2*x2-x1+1, y2, null);
        this.father.leftSon = this;
      }
    }else{
      if(y2+y1>0){
        //bottom
        this.father = new TreeNode(x1, 2*y1-y2-1, x2, y2, null);
        this.father.leftSon = this;
      }else{
        //top
        this.father = new TreeNode(x1, y1, x2, 2*y2-y1+1, null);
        this.father.leftSon = this;
      }
    }
    this.father.split();
  }
  _addPoint(point, color, time){
    if(this.flag){
      this.__addPoint(point, color, time);
    }else{
      this.split();
      if(this.leftSon.whetherInclude(point)){
        this.leftSon._addPoint(point, color, time);
      }else{
        this.rightSon._addPoint(point, color, time);
      }
    }
  }
  addPoint(point, color, time){//only called by root node
    if(this.father){
      this.father.addPoint();
    }else{
      if(this.whetherInclude(point)){
        this._addPoint(point, color, time);
      }else{
        this.extend();
        this.father._addPoint(point, color, time);
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
  query(x1, y1, x2, y2, time){//only called by root node
    if(this.father){
      return this.father.query(x1, y1, x2, y2, time);
    }else{
      return this._query(x1, y1, x2, y2, time);
    }
  }
  _query(x1, y1, x2, y2, time){
    if(!this.whetherOverlap(x1, y1, x2, y2)){//不在的话
      return [];
    }else if(this.flag){//子叶的话
      return this.__query(time);
    }else{
      return this.leftSon._query(x1 ,y1, x2, y2, time).concat(
        this.rightSon._query(x1 ,y1, x2, y2, time));
    }
  }
}

var treeRoot = new TreeNode(-edgeSize/2,-edgeSize/2,edgeSize/2-1,edgeSize/2-1,null);

module.exports={
  TreeNode,
  treeRoot
}
