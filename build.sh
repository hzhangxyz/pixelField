echo "require('babel-polyfill')" > ./tmp/common-interface.js
echo "require('babel-polyfill')" > ./tmp/mongodb-interface.js
echo "require('babel-polyfill')" > ./tmp/index.js
cat ./common-interface.js >>./tmp/common-interface.js
cat ./mongodb-interface.js >>./tmp/mongodb-interface.js
cat ./index.js >>./tmp/index.js
node ./node_modules/babel-cli/bin/babel.js ./tmp/common-interface.js ./tmp/mongodb-interface.js ./tmp/index.js -d tmp
node ./node_modules/babel-cli/bin/babel.js common-interface.js local-storage-interface.js render.js -o ./tmp/compressed.js;
cat index.html ./tmp/compressed.js >./tmp/index.html;
echo '</script>' >> ./tmp/index.html
