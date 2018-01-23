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
  var root = await t[0].findAncestor();
  var res = await c[0].find({}).toArray();
  console.log(res)
  await c[0].drop()
  await c[1]()
  return 0;
}

test().then((res)=>{
  console.log(`correct with ${res}`);
  process.exit(0);
}).catch((res)=>{
  console.log(`error with ${res}`);
  process.exit(1)
})
