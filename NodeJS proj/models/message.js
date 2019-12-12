/*
  This is a schema(In RDBMS, it is a table) for Message,
  It defines the properties of Message.
  MVC: M
  This comment was left at 7.Nov.2016 3:29pm
*/

// grab the things we need
var mongoose = require('mongoose');
var User = require("../models/user.js");
//Schema is used to define attributes for our documents(Table).
var Schema = mongoose.Schema;

var Async = require('async')

// create a schema
var messageSchema = new Schema({
  created_at: {
    type: Date,
    default: Date.now
  },
  messageType: String,
  sendDateTime: {
    type: Date,
    required: true
  },
  receivedDateTime: {
    type: Date,
    default: null
  },
  canOpenDateTime: {
    type: Date,
    required: true
  },
  sendTo: {
    type: Schema.ObjectId,
    ref: 'User',
    required: true
  },
  sendFrom: {
    type: Schema.ObjectId,
    ref: 'User',
    required: true
  },
  isDeletedInbox: {
    type: Boolean,
    default: false
  },
  isDeletedOutbox: {
    type: Boolean,
    default: false
  },
  location: {
    type: Schema.ObjectId,
    ref: 'Location',
    default: null
  },
  isLocked: {
    type: Boolean,
    default: true
  },
  content: {
    type: String,
    required: true
  },
  fileLink:{
    type: String,
    required: true
  },
  tempthumb:{
    type: String,
    default : null
  },
  isOpened:{
    type: Boolean,
    default: false
  }
});

messageSchema.statics.messageWatched = function( message_id, callBack ){
  this.findOneAndUpdate({
    _id : message_id
  }, {
    isOpened : true
  }, {
    upsert : true
  }, function(error){
    if(error){
      console.log(error.message);
      callBack({ status : 'fail', errorMessage : error.message});
    } else {
      callBack( {status : 'success'});
    }
  });
}

//checking whether sender_id is following receiver_id or not, and put the boolean on callBack function
var checkFollowing = function( sender_id, receiver_id, callBack){
  User.findOne({
    _id : sender_id
  }, function(error, User){

    if(error){
      console.log(error.message);
    }

    const followingArray = User._doc.following;

    if(followingArray.indexOf(receiver_id) > -1 ){
      callBack(true);
    } else {
      callBack(false);
    }
  });
}

//Static method for insertion of a message
messageSchema.statics.insertMessage = function(newMessageJSON, callBack) {
  var Message = mongoose.model('Message', messageSchema);

  newMessageJSON['receivedDateTime'] = Date.now();

    // if (isFollowing) {
    //   newMessageJSON['accessibility'] = 'private';
    // } else {
    //   newMessageJSON['accessibility'] = 'public';
    // }

  var newMessage = new Message(newMessageJSON);

  //Create a document(Tuple) in the database (Insert a message)
  newMessage.save(function(error) {
    if (error) {
      console.log(error.message);
      callBack('Insert failed!');
    } else {
      console.log("Insert message successfully");
      callBack({status : 'success'});
    }
  });

}

//Get the message that can be unlocked at 'this' moment
messageSchema.statics.getMSGCanBeOpen = function( callback ) {
  // var query =
  //     this.find(
  //         {'canOpenDateTime': {
  //             $lte: new Date().toISOString()
  //         },
  //             isLocked: true
  // });
  // query.populate('sendTo')
  // // console.log(query);
  // return query;

    this
        .find( {
            canOpenDateTime : { $lte: new Date().toISOString() },
            isLocked: true ,
            isDeletedInbox : false,
            isDeletedOutbox : false
        })
        .exec(function ( error, message ) {
            if (error)
                console.log(error)
            else
                callback(message)
        })

}


//Get locked message in an inbox of the owner (C"R"UD)
messageSchema.statics.getInboxLocked = function(receiverID, cutOff, callBack) {

  if(cutOff == null){
    cutOff = new Date();
  }
  var dayBefore1s = new Date(cutOff);
  dayBefore1s.setSeconds(dayBefore1s.getSeconds() + 1);

  var query = User.findOne({ _id: receiverID });
  var Request_infomation;
  query.exec(function(error, User){

    if(error){
      console.log(error.message);
    }

    Request_infomation = User;

    query = Message.find({
      'sendTo': receiverID,
      isLocked: true,
      isDeletedInbox: false,
      canOpenDateTime: {$gte: dayBefore1s}
    }).sort({canOpenDateTime: -1})
      .populate({ path : 'sendFrom', model:'User', select : 'username email isPublic profilePicture' })
      .populate({ path : 'location', model:'Location'})
      // .limit(10);

    query.exec(function(error, Messages){

      if(error){
        console.log(error.message);
      }

      var result = [];
      for(var i=0;i<Messages.length; i++){
        var temp = Messages[i]._doc;
        if(Request_infomation.following.indexOf(Messages[i].sendFrom._id) > -1){
          temp['accessibility'] = 'private';
        } else{
          temp['accessibility'] = 'public';
        }
        if(Request_infomation.bookMarked.indexOf(Messages[i]._id) > -1){
          temp['bookMarked'] = true;
        } else {
          temp['bookMarked'] = false;
        }
        result.push(temp);
      }
      callBack(result);

    });
  });
}

//Get unlocked message in an inbox of the owner (C"R"UD)
messageSchema.statics.getInboxUnlocked = function(receiverID, cutOff, callBack) {

  if(cutOff == null){
    cutOff = new Date();
  }
  var dayBefore1s = new Date(cutOff);
  dayBefore1s.setSeconds(dayBefore1s.getSeconds() - 1);

  var query = User.findOne({ _id: receiverID });
  var Request_infomation;

  query.exec(function(error, User){

    if(error){
      console.log(error.message);
    }

    Request_infomation = User;

    query = Message.find({
      'sendTo': receiverID,
      isLocked: false,
      isDeletedInbox: false,
      canOpenDateTime: {$lt: dayBefore1s}
    }).sort({canOpenDateTime: -1})
      .populate({ path : 'sendFrom', model:'User', select : 'username email isPublic profilePicture' })
      .populate({ path : 'location', model:'Location'})
      // .limit(10);

    query.exec(function(error, Messages){
      var result = [];
      for(var i=0;i<Messages.length; i++){
        var temp = Messages[i]._doc;
        if(Request_infomation.following.indexOf(Messages[i].sendFrom._id) > -1){
          temp['accessibility'] = 'private';
        } else{
          temp['accessibility'] = 'public';
        }
        if(Request_infomation.bookMarked.indexOf(Messages[i]._id) > -1){
          temp['bookMarked'] = true;
        } else {
          temp['bookMarked'] = false;
        }
        result.push(temp);
      }
      callBack(result);

    });
  });

}

//Get waiting(locked) message in an outbox of the owner (C"R"UD)
messageSchema.statics.getOutboxLocked = function(request_id, cutOff, callBack) {

  if(cutOff == null){
    cutOff = new Date();
  }
  var dayBefore1s = new Date(cutOff);
  dayBefore1s.setSeconds(dayBefore1s.getSeconds() + 1);

  var query = User.findOne({ _id: request_id });
  var Request_infomation;
  query.exec(function(error, User){

    if(error){
      console.log(error.message);
    }

    Request_infomation = User;

    query = Message.find({
      'sendFrom': request_id,
      isLocked: true,
      isDeletedOutbox: false,
      canOpenDateTime: {$gte: dayBefore1s}
    }).sort({canOpenDateTime: -1})
      .populate({ path : 'sendTo', model:'User', select : 'username email isPublic profilePicture' })
      .populate({ path : 'location', model:'Location'})
      // .limit(10);

    query.exec(function(error, Messages){

      if(error){
        console.log(error.message);
      }

      var result = [];
      for(var i=0;i<Messages.length; i++){
        var temp = Messages[i]._doc;
        if(Request_infomation.following.indexOf(Messages[i].sendTo._id) > -1){
          temp['accessibility'] = 'private';
        } else{
          temp['accessibility'] = 'public';
        }
        if(Request_infomation.bookMarked.indexOf(Messages[i]._id) > -1){
          temp['bookMarked'] = true;
        } else {
          temp['bookMarked'] = false;
        }
        result.push(temp);
      }
      callBack(result);

    });
  });

}

//Get unlocked message in an inbox of the owner (C"R"UD)
messageSchema.statics.getOutboxUnlocked = function(request_id, cutOff, callBack) {

  if(cutOff == null){
    cutOff = new Date();
  }
  var dayBefore1s = new Date(cutOff);
  dayBefore1s.setSeconds(dayBefore1s.getSeconds() - 1);

  var query = User.findOne({ _id: request_id });
  var Request_infomation;
  query.exec(function(error, User){

    if(error){
      console.log(error.message);
    }

    Request_infomation = User;

    // console.log(Request_infomation);

    query = Message.find({
      'sendFrom': request_id,
      isLocked: false,
      isDeletedOutbox: false,
      canOpenDateTime: {$lt: dayBefore1s}
    })
      .populate({ path : 'sendTo', model:'User', select : 'username email isPublic profilePicture' })
      .populate({ path : 'location', model:'Location'})
      .sort({canOpenDateTime: -1})
      // .limit(10);

    query.exec(function(error, Messages){

      if(error){
        console.log(error.message);
      }

      var result = [];
      for(var i=0;i<Messages.length; i++){
        var temp = Messages[i]._doc;

        if(Request_infomation.following.indexOf(Messages[i].sendTo._id) > -1){
          temp['accessibility'] = 'private';
        } else{
          temp['accessibility'] = 'public';
        }

        if(Request_infomation.bookMarked.indexOf(Messages[i]._id) > -1){
          temp['bookMarked'] = true;
        } else {
          temp['bookMarked'] = false;
        }

        result.push(temp);
      }
      callBack(result);

    });
  });

}

//Static method for update a message of a user (CR"U"D)
messageSchema.statics.updateMessageToUnlock = function( messageID , callback ) {

    this.findOneAndUpdate (
        { _id: messageID},
        { isLocked: false },
        { upsert: true} )

        .exec(function (error) {
            if (error){
                console.log(error )
            } else
                callback()
        })
}


//Static method for delete a message of a user (CRU"D")
messageSchema.statics.deleteMessage = function(msgId, callback) {

    this
        .findOneAndUpdate({ _id : msgId }, {$set : {isDeletedInbox: true, isDeletedOutbox: true }})
        .exec(function (error, doc) {
            if (error){
                console.log(error)
            } else {
                callback(doc)
            }
        })

}

// the schema is useless so far
// we need to create a model using it
var Message = mongoose.model('Message', messageSchema);

// make this available to our users in our Node applications
module.exports = Message;
