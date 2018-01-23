var mongodbInterface = require("./mongodb-interface.js");

async function test(){
  var tree = [];
  var c = await mongodbInterface.getCollection();
  var t = mongodbInterface.createTree(mongodbInterface.MongodbTreeNode, tree, c[0]);
  await t.addPoint({x:0,y:0},{r:1,g:0,b:0},1)
  await t.addPoint({x:0,y:1},{r:2,g:0,b:0},2)
  await t.addPoint({x:0,y:1},{r:3,g:0,b:0},3)
  await t.addPoint({x:0,y:100},{r:2,g:0,b:0},4)
  await t.disinit()
  await t.addPoint({x:0,y:1},{r:4,g:0,b:0},5)
  await t.fresh()
  console.log((await c[0].find({}).toArray())[0]);
  //下面是没问题的
  var t = await t.findAncestor();
  //await c[0].drop()
  await c[1]()
  return 0;
}

test().then((res, n)=>{
  console.log(`correct with ${res}`);
  process.exit(0);
})
