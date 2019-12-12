/*
  This is a schema(In RDBMS, it is a table) for Memory,
  It defines the properties of Memory.
  MVC: M
  This comment was left at 24.Nov.2016 12:38pm
*/

// grab the things we need

var mongoose = require('mongoose');
//Schema is used to define attributes for our documents(Table).
var Schema = mongoose.Schema;
var user = require("../models/user.js");
var Message = require("../models/message.js");


// create a schema
var memorySchema = new Schema({
  _creator: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  postDateTime: {
    type: Date,
    required: true
  },
  message: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  likeNumber: {
    type: Number,
    default: 0
  },
  likeByReader: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }],
  memoryStatus: {
    type: String,
    default: null
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  commentList: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  }]
});

//Static method for insertion of a memory
memorySchema.statics.insertMemory = function(newMemoryJSON) {
  var Memory = mongoose.model('Memory', memorySchema);
  var newMemory = new Memory(newMemoryJSON);
  var creator_id = newMemoryJSON._creator;

  console.log("memorySchema insertMemory", newMemory);
  var isError = false;

  //Create a document(Tuple) in the database (Insert a memory)
  newMemory.save(function(error) {

    if (error) {
      isError = true;
      console.log(error);
    }

    user.update({
        _id: creator_id
    }, {
        $pushAll: {
            memories: [newMemory.id]
        }
    }, {
        upsert: true
    }, function(error, rawRespone) {
        if (error) {
            console.log(error);
        } else {
            console.log("Add to User's memory Success");
        }
    });

    console.log("Add memory successfully");
    isError = false;
  });

  return isError;
}

//Get memories by user id
memorySchema.statics.getMemoriesByUserId = function(userId, cutOff) {

  if(cutOff == null){
    cutOff = new Date();
  }

  var dayBefore1s = new Date(cutOff);
  dayBefore1s.setSeconds(dayBefore1s.getSeconds() - 1);

  var query = this
    .find({
      _creator: userId,
      postDateTime: {$lt: dayBefore1s}
    })
    .populate({ path : 'commentList', model:'Comment', populate : {path: 'creator', model: 'User' }})
    .populate('_creator','_id username email isPublic profilePicture')
    .populate({ path : 'message', model :'Message' , populate : {path : 'location', model : 'Location'}})
    .sort({postDateTime: -1})
    .limit(10)
  // console.log(query);
  return query;
}

memorySchema.statics.getlikeOnMemory = function(requestJSON) {

  var query = mongoose.model('Memory', memorySchema)
  .findOneAndUpdate
  (
    {_id:requestJSON.Memoryid},
    { $pushAll:{likeByReader:[requestJSON.sender_id]} , $inc: { likeNumber : 1} },
    {upsert:true, new:true}
  );

  return query;
}

memorySchema.statics.getUnlikeOnMemory = function(requestJSON) {

  var query = this.update( {_id:requestJSON.Memoryid}, { $pull:{likeByReader:requestJSON.sender_id} , $inc: { likeNumber : -1} } );

  return query;
}

memorySchema.statics.getLikeList = function(requestJSON) {

  var query = this.findOne({_id: requestJSON.Memoryid}).populate('likeByReader' , { _id:1, username:1, email:1, isPublic:1, profilePicture:1 });

  return query;

}

//Get memories by latest time
memorySchema.statics.getMemoriesByLatestTime = function(userArray, sender_id, cutOff) {

    userArray.push(sender_id)

    if(cutOff == null){
      cutOff = new Date();
    }

    var dayBefore1s = new Date(cutOff);
    dayBefore1s.setSeconds(dayBefore1s.getSeconds() - 1);

    var query = this.find
      ({ postDateTime: {$lt: dayBefore1s}} ) // condiftion : postDateTime before the cutOff time
      .where('_creator').in(userArray) // condition : _creator contain user_id s in userArray
      .sort({postDateTime: -1})
      .populate({ path : 'commentList', model:'Comment', populate : {path: 'creator', model: 'User' }})
      .populate('_creator','_id username email isPublic profilePicture')
      .populate({ path : 'message', model :'Message' , populate : {path : 'location', model : 'Location'}})
      .limit(10); // limit 10 output

    return query;
}

memorySchema.statics.pushComment = function(Comment_id, Memory_id, callBack) {

  var query = mongoose.model('Memory', memorySchema)
  .findOneAndUpdate
  (
    {_id:Memory_id},
    { $pushAll:{commentList:[Comment_id]} },
    {upsert:true, new:true}
  );

  query.exec(function(error, doc){
      if(error){
        console.log(error.message);
      } else {
        callBack(doc);
      }

  });
}

memorySchema.statics.getCommentList = function (memory_id, callBack) {
  var query = mongoose.model('Memory', memorySchema).findOne({
    _id : memory_id
  }).populate({ path : 'commentList', model :'Comment' , populate : {path : 'creator', model : 'User', select : 'username profilePicture'}});

  query.exec(function(error, comments){
    if(error){
      console.log(error.message);
    }
    callBack(comments.commentList);
  });
}

// the schema is useless so far
// we need to create a model using it
var Memory = mongoose.model('Memory', memorySchema);

// make this available to our users in our Node applications
module.exports = Memory;
