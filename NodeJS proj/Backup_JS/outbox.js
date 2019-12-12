/*
  After reconstruct the code structure, this JS is just a backup (This application doesn't require this JS).
  This comment was left at 7.Nov.2016
*/

// grab the things we need
var mongoose = require('mongoose');
//Schema is used to define attributes for our documents(Table).
var Schema = mongoose.Schema;

// create a schema
var outboxSchema = new Schema({
  _owner: {
    type: String,
    ref: 'User'
  },
  messages: [{
    created_at: {
      type: Date,
      default: Date.now
    },
    messageType: String,
    sendDateTime: Date,
    canOpenDateTime: Date,
    sendTo: String,
    sendFrom: String,
    content: String
  }]
});

//Static method for creating an outbox ("C"RUD)
outboxSchema.statics.createOutbox = function(newUserJSON) {
  var OutboxModel = mongoose.model('Outbox', outboxSchema);
  var newOutbox = new OutboxModel({
    _owner: newUserJSON.username,
  });

  //Create a document(Tuple) in the database
  newOutbox.save(function(err) {
    if (err) throw err;
    console.log("A new outbox for " + newUserJSON.username +
      " is created");
  });

  return newOutbox;
}

//Get inbox of the owner (C"R"UD)
outboxSchema.statics.getInbox = function(owner) {
  var query = this.findOne({
    '_owner': owner
  });
  return query;
}

//Static method for update or insert new message into outbox (CR"U"D)
outboxSchema.statics.upsertMessage = function(newMessageJSON) {
  this.update({
    _owner: newMessageJSON.sendFrom
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
      console.log("Successfully added to " + newMessageJSON.sendFrom +
        " outbox");
    }
  });
}

// the schema is useless so far
// we need to create a model using it
var Outbox = mongoose.model('Outbox', outboxSchema);

// make this available to our users in our Node applications
module.exports = Outbox;
