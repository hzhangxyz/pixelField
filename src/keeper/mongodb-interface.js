var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var commonInterface = require("./common-interface.js");

var url = 'mongodb://localhost:27017';
var dbName = 'pixelField';

async function getCollection(){
  var client = await MongoClient.connect(url);
  var db = client.db(dbName);
  var collection = db.collection('a');
  return [collection,async ()=>await client.close()]
  //var res = await collection.insertMany([{'a':4}]);
}

getCollection().then((res)=>{
  console.log(res)
  process.exit();
})
