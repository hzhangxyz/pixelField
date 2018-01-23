var mongodbInterface = require("./mongodb-interface.js");

async function test(){
  var c = await mongodbInterface.getCollection();
  var t = mongodbInterface.createTree(
    mongodbInterface.MongodbTreeNode);
  await t[0].init(c[0])
  await t[0].addPoint({x:0,y:0},{r:1,g:0,b:0},1)
  await t[0].addPoint({x:2,y:0},{r:1,g:0,b:0},2)
  await t[0].addPoint({x:2,y:0},{r:1,g:0,b:0},4)
  await t[0].addPoint({x:0,y:100},{r:2,g:0,b:0},2)
  var id = t[2].id
  delete t[2]//指向他的连接怎么办?
  delete t[1].rightSon
  t[1].rightSon = new mongodbInterface.ReadNode(id, t)
  await t[1].rightSon.init(t[1].collection)
  console.log(t[1])
  console.log(t[1].rightSon.data)
  //下面是没问题的
  var root = await t[0].findAncestor();
  var res = await c[0].find({}).toArray();
  //console.log(res)
  await c[0].drop()
  await c[1]()
  return 0;
}

test().then((res, n)=>{
  console.log(`correct with ${res}`);
  process.exit(0);
}).catch((res, n)=>{
  console.log(`error with ${res}`);
  process.exit(1)
})
