var mod = require("./common-interface.js")
tree = mod.treeRoot
tree.addPoint({x:0,y:0},{r:0,g:0,b:0},0)
tree.addPoint({x:0,y:100},{r:0,g:0,b:0},0)
console.log(tree.father.rightSon)
