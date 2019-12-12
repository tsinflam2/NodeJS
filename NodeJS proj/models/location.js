var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var locationSchema = new Schema({

    name : {
      type:String,
      required: true
    },
    address : {
      type:String,
      required: true
    },
    latitude :{
      type:Number,
      default: null
    },
    longitude :{
      type:Number,
      default: null
    }

});

var Location = mongoose.model('Location', locationSchema);

// = {name:'hello', address:'you home', latitude:'321312', longitude:'321323'}
var createLocation = function(JSONObject, callBack){
  var temp = new Location(JSONObject);
  temp.save();
  callBack(temp);
}

var findNearby = function(latitude, longitude, callBack){
  const range = 0.0005;
  Location.find()
    .and([
      {latitude : {$gt: (latitude - range) , $lt: (latitude + range)}} ,
      {longitude : {$gt: (longitude - range) , $lt: (longitude + range)}}
    ]) .exec (function(error, locs){
      if(error){
        console.log(error.message);
      }
      callBack(locs);
    });
}

var findLocationByName = function ( request, callBack ){
  Location.find({'name' : new RegExp(request, 'i')}, function(err, Locations){
    callBack(Locations);
  });
}

module.exports = {
  createLocation, findNearby, findLocationByName
}
