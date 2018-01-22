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
  add(point, color, time){
    this.data[this.top] = {x:point.x, y:point.y, r:color.r, g:color.g, b:color.b, t:time, abandoned:false};
    for(var i=0;i<this.top;i++){
      if(this.data[i] && this.data[i].x==point.x && this.data[i].y==point.y){
        this.data[i] = {abandoned: true};
      }
    }
    this.topx++;
  }
  query(time){
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

class WorldTreeNode{
  constructor(x1, y1, x2, y2, timeLineName, timeLineTop, leftSon, rightSon){

  }
}

function addPoint(point, color){
  tree.search(point, color)
    .add(point, color);
}

function query(x, y){

}
