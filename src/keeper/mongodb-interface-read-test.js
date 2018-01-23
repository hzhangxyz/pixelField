var mongodbInterface = require("./mongodb-interface.js");

async function recovery(data){
  return data
}

async function test(){
  var c = await mongodbInterface.getCollection();
  t = await recovery(await (c[0].findOne()))
  console.log(t)
}

test().then((res)=>{
  console.log(`correct with ${res}`);
  process.exit(0);
}).catch((res)=>{
  console.log(`error with ${res}`);
  process.exit(1)
})
