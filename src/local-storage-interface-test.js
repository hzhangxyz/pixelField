
async function test(){
  var c = await getCollection();
  var t = createTree(LocalStorageTreeNode, c);
  await t.addPoint({x:0,y:0},{r:1,g:0,b:0},1)
  await t.addPoint({x:0,y:1},{r:2,g:0,b:0},2)
  await t.addPoint({x:0,y:1},{r:3,g:0,b:0},3)
  await t.addPoint({x:0,y:100},{r:2,g:0,b:0},4)
  await t.addPoint({x:0,y:1},{r:3,g:0,b:0},3)
  await t.addPoint({x:0,y:100},{r:5,g:0,b:0},5)
  await t.freshAll()
  var t = await t.findAncestor();
  return 0;
}

test().then((res, n)=>{
  console.log(`correct with ${res}`);
}).catch((res)=>{
  console.log(res)
})
