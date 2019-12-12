var mongoose = require('mongoose');
var user = require("../models/user.js");
var Schema = mongoose.Schema;

var notifSchema = new mongoose.Schema({
  type: String,
  sender_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  receiver_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  time: {
    type: Date,
    default: Date.now
  },
  follow_id:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  memories_id:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Memory',
    default: null
  }
});

notifSchema.statics.getNoti = function( _id, cutOff, callBack){

  if(cutOff == null){
    cutOff = new Date();
  }
  var dayBefore1s = new Date(cutOff);
  dayBefore1s.setSeconds(dayBefore1s.getSeconds() - 1);

  mongoose.model('Notifi', notifSchema). find({
    receiver_id : _id,
    time : {$lt: dayBefore1s}
  }).populate({
              path: 'sender_id',
              model : 'User' ,
              select: '_id username isPublic'
            })
  .sort({time : 1})
  .exec(function(error, notis){
    if(error){
      console.log(error.message);
    }
    callBack(notis)
  });
}


module.exports = mongoose.model('Notifi', notifSchema);
