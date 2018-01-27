mkdir -p build
node ./node_modules/babel-cli/bin/babel.js *.js -d ./build/ $DEBUG ||
  nodejs ./node_modules/babel-cli/bin/babel.js *.js -d ./build/ $DEBUG
cp ./index.html ./build/index.html
