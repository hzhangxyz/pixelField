var mongodbInterface = require("./mongodb-interface.js");

async function test(){
  var c = await mongodbInterface.getCollection();
  var tree = await mongodbInterface.recovery(c[0])
  if(!tree){return}
  console.log(await tree.query(-10,10,-10,10))
  c[0].drop()
  c[1]()
  return 0;
}

test().then((res, n)=>{
  console.log(`correct with ${res}`);
  process.exit(0);
})
