
async function test(){
  var c = await getCollection();
  await clearData(c);
  var t = createTree(LocalStorageTreeNode, c);
  await t.addPoint({x:0,y:0},{r:250,g:150,b:240},1)
  await t.addPoint({x:0,y:1},{r:0,g:200,b:0},2)
  await t.addPoint({x:2,y:2},{r:230,g:0,b:100},3)
  await t.addPoint({x:0,y:100},{r:100,g:200,b:0},4)
  await t.addPoint({x:0,y:1},{r:3,g:0,b:150},3)
  await t.addPoint({x:0,y:100},{r:5,g:0,b:200},5)
  await t.freshAll()
  var t = await t.findAncestor();
  return 0;
}

test().then((res, n)=>{
  console.log(`correct with ${res}`);
}).catch((res)=>{
  console.log(res)
})
