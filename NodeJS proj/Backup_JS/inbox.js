/*
  After reconstruct the code structure, this JS is just a backup (This application doesn't require this JS)
  This comment was left at 7.Nov.2016
*/

// grab the things we need
var mongoose = require('mongoose');
//Schema is used to define attributes for our documents(Table).
var Schema = mongoose.Schema;

// create a schema
var inboxSchema = new Schema({
  _owner: {
    type: String,
    ref: 'User',
    required: true
  },
  messages: [{
    created_at: {
      type: Date,
      default: Date.now
    },
    messageType: String,
    sendFrom: String,
    sendDateTime: Date,
    receivedDateTime: {
      type: Date,
      default: null
    },
    canOpenDateTime: Date,
    isBookMarked: {
      type: Boolean,
      default: false
    },
    isLocked: {
      type: Boolean,
      default: true
    },
    accessibility: {
      type: String,
      default: 'public'
    },
    content: String
  }]
});

//Static method for creating an inbox ("C"RUD)
inboxSchema.statics.createInbox = function(newUserJSON) {
  var InboxModel = mongoose.model('Inbox', inboxSchema);
  var newInbox = new InboxModel({
    _owner: newUserJSON.username,
  });

  //Create a document(Tuple) in the database
  newInbox.save(function(err) {
    if (err) throw err;
    console.log("A new inbox for " + newUserJSON.username + " is created");
  });

  return newInbox;
}

//Get inbox of the owner (C"R"UD)
inboxSchema.statics.getInbox = function(owner) {
  var query = this.findOne({
    '_owner': owner
  });
  return query;
}

//Static method for update or insert new message into inbox (CR"U"D)
inboxSchema.statics.upsertMessage = function(newMessageJSON) {
  this.update({
    _owner: newMessageJSON.sendTo
  }, {
    $pushAll: {
      messages: [newMessageJSON]
    }
  }, {
    upsert: true
  }, function(err, rawResponse) {
    if (err) {
      console.log(err);
    } else {
      console.log("Successfully added to " + newMessageJSON.sendTo +
        " inbox");
    }
  });
}

// the schema is useless so far
// we need to create a model using it
var Inbox = mongoose.model('Inbox', inboxSchema);

// make this available to our users in our Node applications
module.exports = Inbox;
