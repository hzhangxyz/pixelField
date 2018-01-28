mkdir -p build
node ./node_modules/babel-cli/bin/babel.js *.js -d ./build/ $DEBUG ||
  nodejs ./node_modules/babel-cli/bin/babel.js *.js -d ./build/ $DEBUG
cp ./index.html ./build/index.html
cd ./build
tar zcvf `git rev-parse HEAD`.tar.gz *.js *.html
