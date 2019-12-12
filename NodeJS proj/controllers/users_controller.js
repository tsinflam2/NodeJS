/*
  This is a controller of user, it defines the properties of User.
  MVC: C
  This comment was left at 7.Nov.2016 3:29pm
*/

// Setup basic express server
var express = require('express');
// var session = require('express-session');
var app = express();
var server = require('http').createServer(app);
//configure app
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var config = require('../config');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(cookieParser());
// app.use(session({secret: 'ssshhhhh'}));
var crypto = require("crypto");
var user = require("../models/user.js");
var jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
var UserModel = new user();
var sess;

exports.create = function(req, res) {
  user.createAccount(req.body, function(response){
    console.log(response);
    res.send(response)
  })
}

exports.loginAnyway = function (req, res) {
    user.findOne({
        email: req.body.email
    }, function (err, result) {
        res.send(result)
    })
}

exports.listAllUser = function (req, res) {
    user.find({}, function (err, result) {
        var results = [];
        for (var i =0 ;i < result.length ; i++){
            var temp = {
                username : result[i].username,
                email : result[i].email
            }
            results.push(temp)
        }
        res.send(results)
    })
}

exports.login = function(req, res) {

    var user_id;

    if (req.method.toLowerCase() != "post") {
        res.render("login.jade", {
            layout: false
        });
    } else {
        user.findOne({
            email: req.body.email
        }, function(err, result) {
            if (err) console.log(err);
            if (result == null) {
                var responseJSON = {
                    username: '',
                    msg: 'invalid username'
                }
                res.send(responseJSON);
            } else {
                auth(result);
            }
        });

        function auth(userRes) {
            if (!(UserModel.encrypt(req.body.password) == userRes.password)) {
                var responseJSON = {
                    username: '',
                    msg: 'invalid password'
                }
                res.send(responseJSON);
            } else {
                user.update({
                    _id: userRes._id
                }, {
                    '$set': {
                        token: Date.now
                    }
                });

                res.send(userRes);

                user.findOneAndUpdate({ _id : userRes._id }, {$set : { logined : true, userLogOut: false }}, {upsert: true})
                    .exec(function(error){
                        if (error){
                            console.log(error);
                        } else {
                            console.log('success');
                        }
                    })


            }
        }
    }
}



exports.logout = function( id , callback ) {
   user.logout(id, callback)
}

//Find the particular user by email
exports.findUserByEmail = function(req, res) {
    return user.queryUserByEmail(req);
}

//Find the particular user by user id
exports.findUserByUserId = function(req, res) {
    return user.queryUserByUserId(req);
}

exports.findUserByID = function( id, callback ) {
    return user.findUserByID( id, callback);
}

//Find the particular user by user id
exports.setFCMTokenByUserId = function(userId, FCMToken, res) {
    console.log("setFCMTokenByUserId request : " + userId);
    console.log("setFCMTokenByUserId request : " + FCMToken);
    return user.updateFCMTokenByUserId(userId, FCMToken);
}

// exports.addFriend = function(req, res) {
//
//   if(req.method.toLowerCase() != "get") {
//     res.render("login.jade", {layout: false});
//   } else {
//     console.log(req.query.email);
//     user.findOne({email: req.body.email}, function(err, result) {
//        if(err) console.log(err);
//          if(result == null) {
//            var userA = result;
//
//            console.log(userA);
//          }
//     });
//   }
//
// }

//Handle friend list request (Johnny)
exports.requestFriendList = function(req, res) {
       var query = user.queryFriendList();
    return query;
}

//Handle get noti (Ken)
exports.getNoti = function(user_id, callback, cutoffTime) {
    return user.queryNoti(user_id , callback);
}

//Handle get album(Johnny)
exports.getAlbum = function(req, res) {
    return user.queryAlbum(req);
}

//Handle get newsfeed(Johnny)
exports.getNewsfeed = function(request, res) {
    return this.findUserByUserId(request.target_id).populate('following');
}

//Handle edit profile (Ken)
exports.editProfile = function(req, res) {
    return user.editProfile(req);
}

//Handle get old password request (Ken)
exports.getOldPassword = function(req, res) {
    return user.queryOldPassword(req);
}

//Handle check passwor request (Ken)
exports.checkPassword = function(req, res) {
    return user.verifyPassword(req);
}

exports.follow_request_public = function(req ,res) {
    return user.queryFollowPublic(req);
}

exports.follow_request_private = function(req ,res) {
    return user.queryFollowPrivate(req);
}

exports.unfollow = function(req ,res) {
    return user.queryUnfollow(req);
}

exports.acceptFollow = function(req ,res) {
    return user.queryAcceptRequest(req);
}

exports.denyFollow = function(req ,res) {
    return user.queryDenyRequest(req);
}

exports.removeRequest = function(req){
  return user.queryRemoveRequest(req);
}

exports.changeUserStatus = function(request){
  return user.queryChangeStatus(request);
}

exports.findUserByEmailPiece = function(request){
  return user.queryFindUserByEmailPiece(request);
}

