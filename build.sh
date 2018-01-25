if [ `which nodejs 2>/dev/null` ];
then
  NODE=nodejs
else
  NODE=node
fi

echo "require('babel-polyfill')" > ./tmp/_common-interface.js
echo "require('babel-polyfill')" > ./tmp/_mongodb-interface.js
echo "require('babel-polyfill')" > ./tmp/_index.js
cat ./common-interface.js >>./tmp/_common-interface.js
cat ./mongodb-interface.js >>./tmp/_mongodb-interface.js
cat ./index.js >>./tmp/_index.js
$NODE ./node_modules/babel-cli/bin/babel.js ./tmp/_common-interface.js -o ./tmp/common-interface.js $DEBUG
$NODE ./node_modules/babel-cli/bin/babel.js ./tmp/_mongodb-interface.js -o ./tmp/mongodb-interface.js $DEBUG
$NODE ./node_modules/babel-cli/bin/babel.js ./tmp/_index.js -o ./tmp/index.js $DEBUG
$NODE ./node_modules/babel-cli/bin/babel.js common-interface.js local-storage-interface.js render.js -o ./tmp/compressed.js $DEBUG
expr `cat index.html | wc -l` - 4 | xargs head index.html -n > ./tmp/index.html
echo '<script>' >> ./tmp/index.html
cat ./tmp/compressed.js >> ./tmp/index.html;
echo '</script>' >> ./tmp/index.html
