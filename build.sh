echo "require('babel-polyfill')" > ./tmp/_common-interface.js
echo "require('babel-polyfill')" > ./tmp/_mongodb-interface.js
echo "require('babel-polyfill')" > ./tmp/_index.js
cat ./common-interface.js >>./tmp/_common-interface.js
cat ./mongodb-interface.js >>./tmp/_mongodb-interface.js
cat ./index.js >>./tmp/_index.js
node ./node_modules/babel-cli/bin/babel.js ./tmp/_common-interface.js -o ./tmp/common-interface.js $DEBUG
node ./node_modules/babel-cli/bin/babel.js ./tmp/_mongodb-interface.js -o ./tmp/mongodb-interface.js $DEBUG
node ./node_modules/babel-cli/bin/babel.js ./tmp/_index.js -o ./tmp/index.js $DEBUG
node ./node_modules/babel-cli/bin/babel.js common-interface.js local-storage-interface.js render.js -o ./tmp/compressed.js $DEBUG
cat index.html ./tmp/compressed.js >./tmp/index.html;
echo '</script>' >> ./tmp/index.html
