mkdir -p build
node ./node_modules/babel-cli/bin/babel.js *.js -d ./build/ $DEBUG ||
  nodejs ./node_modules/babel-cli/bin/babel.js *.js -d ./build/ $DEBUG
expr `cat index.html | wc -l` - 3 | xargs head index.html -n > ./build/index.html
echo '<script>' >> ./build/index.html
cat ./build/front-model.js ./build/front-driver.js >> ./build/index.html;
echo '</script>' >> ./build/index.html
