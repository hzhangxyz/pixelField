mkdir -p build
DIR=`git rev-parse HEAD`
node ./node_modules/babel-cli/bin/babel.js *.js -d ./build/$DIR $DEBUG ||
  nodejs ./node_modules/babel-cli/bin/babel.js *.js -d ./build/$DIR $DEBUG
cp ./index.html ./build/$DIR/index.html
cp ./m.html ./build/$DIR/m.html
cp ./package.json ./build/$DIR/
cd ./build
tar zcvf $DIR.tar.gz $DIR
