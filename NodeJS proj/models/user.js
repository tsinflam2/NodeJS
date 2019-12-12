/*
  This is a schema(In RDBMS, it is a table) for User, it defines the properties of User.
  MVC: M
  This comment was left at 7.Nov.2016 3:29pm
*/

//This module is used to add notification (Made by Ken)
var Notifi = require('./notif');

var sQ = require('./securityQuestion');
var securityQuestion = sQ.SQSchema;


var extend = require('util')._extend;

var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId,
    crypto = require('crypto');
// require('assert');

var Message = require("../models/message.js");

//A module for creation of friendship
// var options = {
//     personModelName:            'User',
//     friendshipModelName:        'Friend_Relationships',
//     friendshipCollectionName:   'foo_bar_userRelationships',
// };

// var FriendsOfFriends = require('friends-of-friends');
// var friendsOfFriends = new FriendsOfFriends(mongoose, options);

//For encryptiion
var algorithm = 'aes-256-cbc';
var key = 'InmbuvP6Z8';
var pw = '';

//USER SCHEMA
var userSchema = new Schema({
  	ObjectId: ObjectId,
    date: {
       type: Date,
       default: Date.now
     },
    username: {
      type: String,
      required: true
    },
		email: {
      type: String,
      unique: true,
      required: true
    },
    password: {
      type: String,
      required: true
    },
    following:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
        unique: true
    }],
    follower:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        unique: true,
        default: null
    }],
    request:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        unique: true,
        default: null
    }],
    beingRequest:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        unique: true,
        default: null
    }],
    status: {
      type: String,
      default: "Hey there! I'm using DearFuture."
    },
    phone:{
      type: String,
      default: null
    },
    FCMToken:{
      type: String,
      default: null
    },
    notifs:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Notifi',
        default: null
    }],
    memories:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Memory',
        default: null
    }],
    isPublic:{
      type: Boolean,
      default: true
    },
    album: [{
        type: String,
        default: null
    }],
    profilePicture:{
        type: String,
        default: null
    },
    backGroundPicture:{
      type: String,
      default: null
    },
    securityQuestion:[{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'securityQuestion',
      default: null
    }],
    bookMarked:[{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null
    }],
    logined : {
        type : Boolean,
        default : false
    },
    userLogOut : {
        type : Boolean,
        default : true
    }
});



// // apply the friends-of-friends mongoose plugin to your user schema
// userSchema.plugin(friendsOfFriends.plugin, options);

//password setter
userSchema.path('password').set(function(v) {
    return this.encrypt(v);
});

//encrypt method for create account
userSchema.methods.encrypt = function encrypt(str) {
    pw = str;
    var cipher = crypto.createCipher(algorithm, key);
    var encrypted = cipher.update(pw, 'utf8', 'hex') + cipher.final('hex');
    console.log("ENCRYPTED: " + encrypted);
    return encrypted;
}

//encrypt method for checking password
userSchema.statics.checkPasswordEcryption = function encrypt(str) {
    pw = str;

    //Check whether the password is empty, if so, return EmptyPassword
    if (!pw || 0 === pw.length) {
        return 'EmptyPassword';
    }

    var cipher = crypto.createCipher(algorithm, key);
    var encrypted = cipher.update(pw, 'utf8', 'hex') + cipher.final('hex');
    console.log("ENCRYPTED: " + encrypted);
    return encrypted;
}

var encryptedPassword = function(str){
  pw = str;
  var cipher = crypto.createCipher(algorithm, key);
  var encrypted = cipher.update(pw, 'utf8', 'hex') + cipher.final('hex');

  return encrypted;
}

//Create account (Used in user_controller)
userSchema.statics.createAccount = function(newUserJSON, callBack) {
    var User = mongoose.model('User', userSchema);
    var newUser = new User(newUserJSON);

    newUser.save(
      function(error) {
        if (error) {
          console.log(error.message);
          callBack({status:'fail', message:error.message})
        } else {
          callBack({status:'success'})
        }
    });

}

userSchema.statics.updateLoginStatus = function ( user_id , callBack) {
    mongoose.model('User', userSchema)
        .findOneAndUpdate({ _id : user_id }, {$set : { logined : true }}, {upsert: true})
        .exec(function(error){
            if (error){
                console.log(error);
                callBack({status:'fail', message: error.message})
            } else {
                callBack({status:'success'})
            }
        })
}

//Find user by users' email
userSchema.statics.queryUserByEmail = function(userEmail) {
    console.log('user model queryUserByEmail listened');
    console.log('user model userEmail of request: ' + userEmail);
    //Push the notifications to User's notifications
    var query = this.findOne({
        email: userEmail
    });
    return query;
}

//Find user by users' id
userSchema.statics.queryUserByUserId = function(userId) {
    var query = this.findOne({
        _id: userId
    });
    return query;
}



//Query the Newsfeed of a user
// userSchema.statics.queryNewsfeed = function(userId) {
//     console.log('user model queryNewsfeed listened');
//
//     var query = this.findOne({
//         _id: userId
//     });
//     return query;
// }

//Update user FCM token
userSchema.statics.updateFCMTokenByUserId = function(userId, token) {
    console.log('user model updateFCMTokenByUserId listened');
    console.log('user model updateFCMTokenByUserId listened ID' + userId);
    console.log('user model updateFCMTokenByUserId listened TOKEN' + token);

    var query = this.findOneAndUpdate({
        _id: userId
    }, {
        $set: {
            FCMToken: token
        }
    }, {
        upsert: true
    });

    return query;
}

//Handle notification
userSchema.statics.pushNoti = function(Type, Sender, Receiver, other_id, callback ) {

    if (callback == null){
        callback = ()=>{}
    }

    var notifi;

    switch (Type) {

      case 'like':

        Notifi.findOne({
          $and : [{sender_id : Sender}, {memories_id : other_id}]
        });

        notifi = new Notifi({
          type: Type,
          sender_id: Sender,
          memories_id : other_id,
          receiver_id : Receiver
      });
        break;

      case 'follower':
        notifi = new Notifi({
          type: Type,
          sender_id: Sender,
          receiver_id : Receiver
      });
        break;

      default:
        notifi = new Notifi({
            type: Type,
            sender_id: Sender,
            receiver_id : Receiver
        });
        break;

    }

    //Insert the notificaton to DB
    notifi.save(function (error, doc) {
        User.update({
            _id: Receiver
        }, {
            $pushAll: {
                notifs: [doc._id]
            }
        }, {
            upsert: true
        }, function(err, rawRespone) {
            if (err) {
                console.log(err);
            } else {
                console.log(doc._id)
                callback()
            }
        });
    });




}

//Requesst friend list
userSchema.statics.queryFriendList = function() {
    var query = this.find({});
    return query;
}


//Get notification (Ken)
// userSchema.statics.queryNoti = function(userId, callBack) {
//
//     var notifs = require('./notif');
//
//     var query = this
//
//       .findOne
//
//       (
//           {
//             _id: userId, //Find by User ID
//           },
//           {
//             notifs : 1 //get Notification only
//           }
//       )
//
//         .populate(
//           {
//             path: 'notifs',
//             model : 'Notifi' ,
//               populate: {
//                 path:'sender_id',
//                 model:'User',
//                 select: '_id username isPublic'
//                 }
//           }
//         ).limit(10);
//
//       query.exec( function(error, result){
//
//           if (result!= null){
//             callBack(result.notifs)
//           } else {
//             console.log(error);
//           }
//
//       });
//
// }



//Get old password (Ken)
userSchema.statics.queryOldPassword = function(userInfo) {
    var query = this.findOne({
        email: userInfo.email
    });
    return query;
}

//Check Password (Ken)
userSchema.statics.verifyPassword = function(passDetail) {

    var encryptedOriginalPassword = User.checkPasswordEcryption(passDetail.originalPassword);

    if (encryptedOriginalPassword == 'EmptyPassword') {
        return {
            proccess_status: 'failure',
            reason: 'EmptyPassword'
        };
    } else if (passDetail.oldPassword != encryptedOriginalPassword) {
        //Case that oldpass not equal the originalpassword
        return {
            proccess_status: 'failure',
            reason: 'passwordNotMatch'
        };
    } else {
        return {
            proccess_status: 'success',
            reason: 'null'
        };
    }

}

//Edit Profile (Ken)
userSchema.statics.editProfile = function(userInfo, callBack) {
  
    mongoose.model('User', userSchema).findOneAndUpdate
    ({
      _id : userInfo.id
    },{
      $set : {
        username : userInfo.username,
        phone :userInfo.phone,
        isPublic: userInfo.isPublic,
        status: userInfo.status
      }
    }, function(error, doc){
      if(error){
          console.log(error.message);
          callBack({status : 'fail', message: error.message})
        }
        else
          callBack({status : 'success'})
      })
}

userSchema.statics.changePassword = function( user_id, oldPassword, newPassword , callBack ){

  // console.log(user_id  +' '+oldPassword+' ' + newPassword);
  mongoose.model('User', userSchema)
    .findOne({ _id : user_id })
    .exec(function( error, user ){
      if(error){
          console.log(error.message);
          callBack({status : 'fail', message: error.message})
        }
        else {

          if(encryptedPassword(oldPassword) != user.password){
            callBack({status : 'fail', message: 'User password not match ' })
          } else {
            mongoose.model('User', userSchema)
              .findOneAndUpdate( { _id : user_id}, {$set : { password : encryptedPassword(newPassword)} } )
              .exec(function(error){
                if(error){
                    console.log(error.message);
                    callBack({status : 'fail', message: error.message})
                  } else {
                    callBack({status : 'success'})
                  }
              })
          }
        }
      })
}

userSchema.statics.queryRenewProfilePicture = function(userId, PicturePath) {

  console.log(userId + ' and ' + PicturePath);

    var query = this.findOneAndUpdate(

        {
            _id: userId
        }, {
            $set: {
              profilePicture : PicturePath
            }
        }, {
            new: true,
            upsert: true
        }
    );
    return query;
}

userSchema.statics.queryRenewProfileBackground = function(userId, PicturePath) {

  console.log(userId + ' and ' + PicturePath);

    var query = this.findOneAndUpdate(

        {
            _id: userId
        }, {
            $set: {
              backGroundPicture : PicturePath
            }
        }, {
            new: true,
            upsert: true
        }
    );
    return query;
}

userSchema.statics.queryFollowPublic = function(request) {
  var query = [];
  query.push(User.update({_id:request.target_id}, {$pushAll:{follower:[request.sender_id]}}, {upsert:true}));
  query.push(User.update({_id:request.sender_id}, {$pushAll:{following:[request.target_id]}}, {upsert:true}));
  return query;
}

userSchema.statics.queryFollowPrivate = function(request) {
  var query = [];
  query.push(User.update({_id:request.target_id}, {$pushAll:{beingRequest:[request.sender_id]}}, {upsert:true}));
  query.push(User.update({_id:request.sender_id}, {$pushAll:{request:[request.target_id]}}, {upsert:true}));
  return query;
}

userSchema.statics.queryUnfollow = function(request) {
  var query = [];
  query.push(User.update({_id:request.target_id}, {$pull:{follower:request.sender_id}}));
  query.push(User.update({_id:request.sender_id}, {$pull:{following:request.target_id}}));
  return query;
}

userSchema.statics.queryAcceptRequest = function(request) {
  var query = [];
  query.push(User.update({_id:request.sender_id}, {$pushAll:{follower:[request.target_id]}}, {upsert:true}));
  query.push(User.update({_id:request.target_id}, {$pushAll:{following:[request.sender_id]}}, {upsert:true}));
  query.push(User.update({_id:request.sender_id}, {$pull:{beingRequest:request.target_id}}));
  query.push(User.update({_id:request.target_id}, {$pull:{request:request.sender_id}}));
  return query;
}

userSchema.statics.queryDenyRequest = function(request) {

  var query = [];
  query.push(User.update({_id:request.sender_id}, {$pull:{beingRequest:request.target_id}}));
  query.push(User.update({_id:request.target_id}, {$pull:{request:request.sender_id}}));
  return query;
}


userSchema.statics.queryAlbum = function(userId) {
  var query = this.find({
      _id: userId
  });

  return query;
  // this.update({
  //   _id: newMessageJSON.sendTo
  // }, {
  //   $pushAll: {
  //     messages: [newMessageJSON]
  //   }
  // }, {
  //   upsert: true
  // }, function(err, rawResponse) {
  //   if (err) {
  //     console.log(err);
  //   } else {
  //     console.log("Successfully added to " + newMessageJSON.sendTo +
  //       " inbox");
  //   }
  // });
}

userSchema.statics.queryRemoveRequest = function(request) {
  var query = [];
  query.push(User.update({_id:request.target_id}, {$pull:{beingRequest:request.sender_id}}));
  query.push(User.update({_id:request.sender_id}, {$pull:{request:request.target_id}}));
  return query;
}

userSchema.statics.queryChangeStatus = function(request) {

  var query = this.findOneAndUpdate({
      _id: request.user_id
  }, {
      $set: {
          status: request.new_status
      }
  }, {
      upsert: true
  });

  return query;

}

userSchema.statics.queryFindUserByEmailPiece = function(request) {
  var query = this.find(
      { $or:[ {'email' : new RegExp(request, 'i')}, {'username' : new RegExp(request, 'i')} ]},
      { _id:1,username:1, email:1, isPublic:1, profilePicture:1, follower:1, following:1}
      );
  return query;
}

userSchema.statics.getRecipientList = function(input, sender_id, callBack) {

  if(!(input ==null) & input.indexOf('@') > -1){
    this.find( {email : input} ,{ _id:1,username:1, email:1, isPublic:1, profilePicture:1 }, function(error, Users){
      if(error){
        console.log(error.message);
      }
      callBack(Users);
    });
  } else {
    var query = this.findOne( { _id : sender_id }).populate({path : 'following', model: 'User', select: '_id username isPublic profilePicture'});
    query.exec(function(error, User) {
      if(error){
        console.log(error.message);
      }
      if(input == ''){
        callBack(User.following);
      } else {
        var result = [];
        for(var i=0;i<User._doc.following.length;i++){
          if(User._doc.following[i].username.includes(input)){
            result.push(User._doc.following[i])
          }
      }
      callBack(result)
      }
    });
  }
}

userSchema.statics.AddbookMark = function(sender_id , message_id, callBack){

    var query = mongoose.model('User', userSchema).findOneAndUpdate({
        _id: sender_id
    }, {
        $pushAll: {
            bookMarked: [message_id]
        }
    }, {
        upsert: true
    });

    query.exec(function(err){
      if(err){
        console.log(err);
        callBack({status: 'fail'})
      } else {
        callBack({status: 'success'})
      }
    });

}

userSchema.statics.removeBookMark = function(sender_id, message_id , callBack){

    var query = mongoose.model('User', userSchema).update({_id:sender_id}, {$pull:{bookMarked:message_id}});

    query.exec(function(err){
      if(err){
        console.log(err);
        callBack({status: 'fail'})
      } else {
        console.log('remove success');
        callBack({status: 'success'})
      }
    });

}

userSchema.statics.getNoti = function( _id , cutOff, callBack ){
  Notifi.getNoti(_id, cutOff, callBack);
}

userSchema.statics.getRelationShip = function( sender_id , target_id, callBack ){

  mongoose.model('User', userSchema)
    .findOne( { _id : sender_id} )
    .exec(function(error, user){
      if(error){
        console.log(error.message);
        callBack({status : 'fail' , message : error.message} )
      } else {
        if( user.following.indexOf(target_id) > -1 ){
          callBack({status : 'success' , message : 'following'} )
        } else {
          callBack({status : 'success' , message : 'nothing'} )
        }
      }
    })
}

userSchema.statics.getBookMark = function(sender_id, callBack){

  var query = mongoose.model('User', userSchema)
      .findOne( {_id : sender_id})
      .populate ( {
          path: 'bookMarked' , model: 'Message' ,
          populate : { path: 'sendTo sendFrom location' }
      });

  query.exec(function(error, User){

    if(error){
      console.log(error.message);
    }

    if(User == null){
        callBack([])
    } else {
        var data = User.bookMarked;
        var result = [];
        for(var i=0;i<data.length; i++){
            var temp = data[i]._doc;
            if(sender_id == temp.sendTo._id){
                if(User.following.indexOf(temp.sendFrom._id) > -1){
                    temp['accessibility'] = 'private';
                } else {
                    temp['accessibility'] = 'public';
                }
            } else {
                if(User.following.indexOf(temp.sendTo._id) > -1){
                    temp['accessibility'] = 'private';
                } else {
                    temp['accessibility'] = 'public';
                }
            }
            temp['bookMarked'] = true
            result.push(temp);
        }
        callBack(result);
    }


  });
}



// userSchema.statics.findUserByKeyword = function(request = 'ken') {
//   var query = mongoose.model('User', userSchema).find({ 'username' : new RegExp(request, 'i')}, { _id:1,username:1, email:1, isPublic:1, profilePicture:1, follower:1, following:1});
//   query.exec(function(err, User){
//     if (User.length < 5){
//
//     }
//   });
// }()

userSchema.statics.findUserByID = function ( id, callback ) {

    mongoose.model('User', userSchema)
        .findOne ({ _id : id })
        .exec (function (error, user ) {
            if (error) {
                console.log(error)
            } else {
                callback(user)
            }
        })
}

userSchema.statics.logout = function ( id, callback ) {

    console.log(id, 'logout')

    mongoose.model('User', userSchema)
        .findOneAndUpdate({ _id : id }, {$set : { userLogOut : true }}, {upsert: true})
        .exec(function (error) {
            if (error){
                console.log(error)
            } else {
                callback()
            }
        })
}

userSchema.statics.findnullAndDel = function(){
  var query = mongoose.model('User', userSchema).findOneAndRemove({
      _id: null
  });
  query.exec(function(err, Users){

  });
}()

var User = mongoose.model('User', userSchema);
// the schema is useless so far
// we need to create a model using it


// make this available to our users in our Node applications
module.exports = User;
