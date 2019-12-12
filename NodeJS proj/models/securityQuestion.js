var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId,
    crypto = require('crypto');

var user = require("../models/user.js");

var securityQuestionSchema = new Schema({

    question : {
      type:String,
      required:true
    },
    answer : {
      type:String,
      required:true
    }

});

var SQSchema = mongoose.model('securityQuestion', securityQuestionSchema);

var randomMath = function(range){
  return parseInt(Math.random() * range);
}

var encrypt = function(str) {
  var cipher = crypto.createCipher('aes-256-cbc', 'InmbuvP6Z8');
  var encrypted = cipher.update(str, 'utf8', 'hex') + cipher.final('hex');
  return encrypted;
}

var createSQ = function (question, answer, user_id, user_pass, callBack) {

  var user = require("../models/user.js");

  user.findOne({
    _id: user_id
  }, function(error, User){
    if(error){
      console.log(error);
    } else {
      if(encrypt(user_pass) != User.password){
        callBack({status:'fail', message: 'password not match'});
    } else {
        var encryptedAnswer = encrypt(answer);

        var JSONObject = { question: question, answer: encryptedAnswer };
        var temp = new SQSchema(JSONObject);
        temp.save();

        user.update({
            _id: user_id
        }, {
            $pushAll: {
                securityQuestion: [temp.id]
            }
        }, {
            upsert: true
        }, function(err, rawRespone) {
            if (err) {
                callBack({status:'fail', message: err.errmsg});
            } else {
                callBack({status:'success'});
            }
        });
    }
  }
});

}



var getSQ = function ( user_email, callBack ){

  var user = require("../models/user.js");

  if(user_email == ''){
    callBack({});
    return;
  }
  var query = user.findOne({ email : user_email }).populate({path:'securityQuestion' , ref: 'securityQuestion'});

  query.exec(function(error, user){

    if(error){
      console.log(error.message);
    }

    if(user == null) {
      callBack({status : 'user_not_found'});

    } else {

      if(user.securityQuestion.length == 0){
        callBack({status : 'user_no_sq'});
        return;
      }

      var noOfQuestion = randomMath(user.securityQuestion.length);

      var callBackObject = {
        status : 'success',
        profilePicture : user.profilePicture,
        username : user.username,
        email: user.email,
        question : user.securityQuestion[noOfQuestion].question,
        noOfQuestion: noOfQuestion}

      callBack(callBackObject);
    }

    });

};

var changePassworBySQ = function(user_email, noOfQuestion, answer, newpass, callBack){

  var user = require("../models/user.js");
  var encryptedAnswer = encrypt(answer);

  var query = user.findOne({ email : user_email}).populate({path:'securityQuestion' , ref: 'securityQuestion'});

  query.exec(function(error, User){

    if(error){
      console.log(error.message);
    }

    if(User.securityQuestion[parseInt(noOfQuestion)].answer != encryptedAnswer){
      callBack({status:'fail', message:'answer not match'});
    } else {
      callBack({status:'success'});
      console.log(newpass);
      var encryptnewpass = encrypt(newpass);
      user.findOneAndUpdate({
        email : user_email
      }, {
        $set : {password : encryptnewpass}
      }, function(error){
        if(error){
          console.log(error.errmsg);
        } else {
          console.log('Changing password success');
        }
      });
    }
  });
};


module.exports = {
  SQSchema, createSQ, getSQ, changePassworBySQ
}
