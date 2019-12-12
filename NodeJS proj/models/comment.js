var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var commentSchema = new Schema({

    content : {
      type:String,
      required: true
    },

    created_at : {
      type: Date,
      default: Date.now
    },

    creator : {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }

});

var Comment = mongoose.model('Comment', commentSchema);

var createComment = function (creator, content, callBack){

  var JSONObject = {creator : creator, content : content};
  var temp = new Comment(JSONObject);
  temp.save(function(err){
    if(err){
      console.log(err);
    } else {
      callBack(temp);
    }
  });
}


module.exports = {
  createComment
}
