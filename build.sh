if [ `which nodejs 2>/dev/null` ];
then
  NODE=nodejs
else
  NODE=node
fi

echo "require('babel-polyfill')" > ./build/_common-interface.js
echo "require('babel-polyfill')" > ./build/_mongodb-interface.js
echo "require('babel-polyfill')" > ./build/_index.js
cat ./common-interface.js >>./build/_common-interface.js
cat ./mongodb-interface.js >>./build/_mongodb-interface.js
cat ./index.js >>./build/_index.js
$NODE ./node_modules/babel-cli/bin/babel.js ./build/_common-interface.js -o ./build/common-interface.js $DEBUG
$NODE ./node_modules/babel-cli/bin/babel.js ./build/_mongodb-interface.js -o ./build/mongodb-interface.js $DEBUG
$NODE ./node_modules/babel-cli/bin/babel.js ./build/_index.js -o ./build/index.js $DEBUG
$NODE ./node_modules/babel-cli/bin/babel.js common-interface.js local-storage-interface.js render.js -o ./build/compressed.js $DEBUG
expr `cat index.html | wc -l` - 4 | xargs head index.html -n > ./build/index.html
echo '<script>' >> ./build/index.html
cat ./build/compressed.js >> ./build/index.html;
echo '</script>' >> ./build/index.html
