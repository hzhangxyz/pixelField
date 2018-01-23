async function test(){
  var c = await getCollection()
  var t = createTree(LocalStorageTreeNode, c)
  await t.addPoint({x:0,y:0},{r:0,g:0,b:0},0)
  console.log(t)
  await t.addPoint({x:0,y:100},{r:0,g:0,b:0},0)
  console.log("----------")
  var t = await t.findAncestor()
  console.log(t)
  console.log("----------")
  console.log(t.rightSon.leftSon)
  return 0;
}

test().then((res)=>{
  console.log(`correct with ${res}`)
},(res)=>{
  console.log(`error with ${res}`)
})
