async function test(){
  var mod = require("./common-interface.js")
  tree = mod.createTree(mod.TreeNode)
  await tree[0].addPoint({x:0,y:0},{r:0,g:0,b:0},0)
  console.log(tree[0])
  await tree[0].addPoint({x:0,y:100},{r:0,g:0,b:0},0)
  console.log("----------")
  var root = await tree[0].findAncestor()
  console.log(root)
  return 0;
}

test().then((res)=>{
  console.log(`correct with ${res}`)
},(res)=>{
  console.log(`error with ${res}`)
})
