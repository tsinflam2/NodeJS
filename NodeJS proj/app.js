// Setup basic express server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
//configure app
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var config = require('./config');

var Async = require('async')

const morgan = require('morgan');

app.disable('x-powered-by');
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(cookieParser());


//Require Schemas
var Message = require('./models/message.js');
var User = require('./models/user.js');
var Memory = require('./models/memory.js');
var Location = require('./models/location.js');
var Comment = require('./models/comment.js');
var securityQuestion = require('./models/securityQuestion.js');
var securityQuestionSchema = securityQuestion.SQSchema;

// app.use(session({secret: 'ssshhhhh'}));
//Mongoose configuration
var mongoose = require('mongoose');
// mongoose.connect('mongodb://ken2027:A123123a@ds149221.mlab.com:49221/dearfuture');
//ken2027 A123123a
// mongoose.connect('mongodb://dearfuture:Cal_DearFuture_2016!@ds145379.mlab.com:45379/dearfuture');

mongoose.connect('mongodb://ken20206:24347622@ds149221.mlab.com:49221/dearfuture');


mongoose.Promise = global.Promise;
//Socket IO configuration
var io = require('socket.io')(server);

var port = process.env.PORT || 80;
//Require other core modules
//Require a custom module that used to send FCM when messages can be unlocked
var fcmSend = require('./custom_modules/FCMSend.js');

var logj = ( res ) =>{
  console.log( JSON.stringify(res, null, 4) )
}

//Require the user controller
var users = require('./controllers/users_controller.js');
var uploadController = require('./controllers/upload_controller.js');
var fellowship_controller = require('./controllers/fellowship_controller');

app.get('/users/create', users.create);
app.post('/users/create', users.create);
app.get('/users/login', users.login);
app.post('/users/login', users.login);

//IMPORTANT -- DELETE THOSE IN PRODUCTION MODE!!
app.post('/users/loginAnyway', users.loginAnyway)
app.post('/users/listAllUser', users.listAllUser)

app.post('/upload', uploadController.uploadFile);
app.post('/uploadProfilePic', uploadController.uploadProfilePic);
app.post('/uploadProfileBackground', uploadController.uploadProfileBackground);

app.post('/api/uploadFile', uploadController.uploadFileToServer)
app.post('/api/deleteFile', uploadController.deleteFileFromServer)

//Firebase Cloud Messaging
var FCM = require('fcm-node');
var serverKey = 'AIzaSyBLSe2xuAEVXOujY4Wb4LvKKpkGAtX0W8s';
var fcm = new FCM(serverKey);

var extend = require('util')._extend;

//Server Listener
server.listen(port, function() {
  console.log('Server listening at port %d', port);
  fcmSend.notifyUnlockMessage();
});

app.use(express.static('public'));

app.post('/api/getNotification', function (req, res) {
    User.getNoti(req.body._id ,req.body.cutOff, (response)=>{
        res.send(response)
    });
})

app.post('/api/getRelation' , function(req, res) {

  User.getRelationShip(req.body.sender_id, req.body.target_id, function(response){
    res.send(response)
  })

});

app.post('/api/getHomePage', function(req,res, next){

  var query = users.findUserByUserId(req.body.sender_id)

  query.exec(function(error, user){

    if(error){
      console.log(error.message);
    }

      query = Memory.getMemoriesByLatestTime(user.following, req.body.sender_id, req.body.cutoffTime);
      query.exec(function(error, memories){
        if(error){
          console.log(error.message);
        }

        if(memories == null){
            return;
        }

        var result = [];
        for(var i=0; i<= memories.length; i++){

          if(i == memories.length){
            res.send(result)
            return;
          }

          if(memories[i].likeByReader.indexOf(req.body.sender_id) > -1){
            result.push({liked : true});
          } else {
            result.push({liked : false});
          }

          var memories_length = memories[i]._doc.commentList.length

          result[i].commentLength = memories_length

          var latestComment = []

          for(var j = 1; j<=8; j++){

            if(memories_length - j < 0){
              break;
            }

            var temp = {}

            temp['commentCreator_id'] = memories[i].commentList[memories_length - j].creator._id
            temp['commentCreator_username'] = memories[i].commentList[memories_length - j].creator.username
            temp['commentCreator_profile'] = memories[i].commentList[memories_length - j].creator.profilePicture
            temp['commentContent'] = memories[i].commentList[memories_length - j].content

            latestComment.push(temp)

          }

          latestComment.reverse()

          result[i].latestComment = latestComment

          result[i] = extend(memories[i]._doc,result[i]);

          delete result[i].commentList


        }
      });
  });
});

app.post('/api/editProfile', function(req,res){
  User.editProfile(req.body, function(response){
    res.send(response)
  })
})

app.post('/api/changePassword', function(req,res){
  User.changePassword(req.body.id, req.body.oldPassword, req.body.newPassword , function(response){

      if (response.status == 'fail'){
          res.status(400).send(response)
      } else {
          res.send(response)
      }
  })
})
//Those have not been change

app.post('/api/getBookmark', function (req, res) {
    User.getBookMark(req.body.sender_id, (respone) => {
        res.send(respone);
    });
})

app.post('/api/addBookmark' , function (req, res) {
    User.AddbookMark(req.body.sender_id, req.body.message_id, (respone) => {
        res.send(respone);
    });
})

app.post('/api/removeBookmark', function (req, res) {
    User.removeBookMark(req.body.sender_id, req.body.message_id, (respone) => {
        res.send(respone);
    });
})

app.post('/api/addLocation/', function (req, res) {
    Location.createLocation(req.body, (respone) => {
        res.send(respone);
    });
})

app.post('/api/findNearby', function (req, res) {
    Location.findNearby(req.body.latitude , req.body.longitude , (respone) => {
        res.send(respone);
    });
})

app.post('/api/findLocation', function (req, res) {
    Location.findLocationByName(req.body.request, (result) => {
        res.send(result);
    });
})

app.post('/api/newMessage', function (req, res) {
    Message.insertMessage(req.body, (message) => {
        fcmSend.sendingMessage(req.body.sendTo, function () {
            res.send(message);
        });
    });
})

app.post('/api/messageOpen', function (req, res) {
    Message.messageWatched(req.body.message_id, (message) => {
        res.send(message );
    });
})

app.post('/api/inboxLocked', function (req, res) {
    var query = Message.getInboxLocked(req.body._id, req.body.cutoffTime, (JSONList) => {
        res.send(JSONList);
    });
})

app.post('/api/inboxUnlocked', function (req, res) {
    var query = Message.getInboxUnlocked(req.body._id, req.body.cutoffTime, (JSONList) => {
        res.send(JSONList);
    });
})

app.post('/api/outboxLocked', function (req, res) {
    var query = Message.getOutboxLocked(req.body._id, req.body.cutoffTime, (JSONList) => {
        res.send(JSONList);
    });
})

app.post('/api/outboxUnlocked', function (req, res) {
    var query = Message.getOutboxUnlocked(req.body._id, req.body.cutoffTime, (JSONList) => {
        res.send(JSONList);
    });
})

app.post('/api/addComment', function (req, res) {
    Comment.createComment(req.body.creator, req.body.content, (commentDocument) => {
        Memory.pushComment(commentDocument.id , req.body.memory_id, (reNewList) => {
            // console.log(reNewList);
            res.send({status : 'success'});
        });
    });
})

app.post('/api/getComment', function (req, res) {
    Memory.getCommentList(req.body.memory_id, (commentList)=>{
        res.send(commentList);
    });
})

app.post('/api/deleteMessage', function (req, res) {

    var messageID = null;
    Async.each([
        function (callback) {
            User.removeBookMark(req.body.sender_id, req.body._id, (respone) => {
                callback()
            });
        }, function (callback) {
            Message.deleteMessage(req.body._id, function ( doc ) {

                var sendTo, sendFrom ;

                if (req.body.sender_id == doc.sendTo) {
                    sendFrom  = doc.sendFrom;
                    sendTo = doc.sendTo;
                } else {
                    sendFrom  = doc.sendTo;
                    sendTo = doc.sendFrom;
                }
                messageID = doc._id;
                User.pushNoti('delete' ,sendTo , sendFrom, null, function () {
                    console.log('Notification push')
                    callback()
                });

            })
        }
    ], function (item, next) {
        item(next)
    }, function (error) {
        if (error)
            console.log(error)
        else {
            res.send({ _id : messageID,isSuccess:true})
        }

    })
})

app.post('/api/getRecipientList', function (req, res) {
    User.getRecipientList(req.body.input, req.body.sender_id, (respone) => {
        res.send(respone);
    });
})

app.post('/api/friendListRequest', function (req,res) {
    var query = users.requestFriendList();
    query.exec(function(err, JSONList) {
        handleError(err, 'friend list request', 'Query failed!');
        res.send(JSONList);
    });
})

app.post('/api/tokenRefresh', function (req, res) {
    var query = users.setFCMTokenByUserId(req.body._id, req.body.token);
    query.exec(function(err) {
        if (err) {
            console.log(err);
            res.send({status:'fail'})
        } else {
            res.send({status:'success'})
        }
    });
})

app.post('/api/newMemory', function (req, res) {
    var isError = Memory.insertMemory(req.body);

    if (isError == false) {
        res.send({
            'isSuccess': true
        });

        User.pushNoti('post' ,req.body._creator , req.body.target_id);

    } else if (isError == true) {
        res.send( {
            'isSuccess': false
        });
    }
})

app.post('/api/getMemories', function (req, res) {
    if(req.body.cutoffTime == null){
        req.body.cutoffTime = new Date()
    }

    var query = Memory.getMemoriesByUserId(req.body._id, req.body.cutoffTime);

    query.exec(function(error, memories) {

        if(error){
            console.log(error)
        }

        var result = [];

        for(var i=0; i<= memories.length; i++){

            if(i == memories.length){
                res.send(result);
                return;
            }

            if(memories[i].likeByReader.indexOf(req.body.sender_id) > -1){
                result.push({liked : true});
            } else {
                result.push({liked : false});
            }

            var memories_length = memories[i]._doc.commentList.length

            result[i].commentLength = memories_length

            var latestComment = []

            for(var j = 1; j<=8; j++){

                if(memories_length - j < 0){
                    break;
                }

                var temp = {}

                temp['commentCreator_id'] = memories[i].commentList[memories_length - j].creator._id
                temp['commentCreator_username'] = memories[i].commentList[memories_length - j].creator.username
                temp['commentCreator_profile'] = memories[i].commentList[memories_length - j].creator.profilePicture
                temp['commentContent'] = memories[i].commentList[memories_length - j].content

                latestComment.push(temp)

            }

            latestComment.reverse()

            result[i].latestComment = latestComment

            result[i] = extend(memories[i]._doc,result[i]);

            delete result[i].commentList
        }
    });
})

app.post('/api/likeOnMemory', function (req, res) {
    var query = Memory.getlikeOnMemory(req.body);
    query.exec(function(error, doc){
        if(error){
            console.log(error);
        } else {
            User.pushNoti('like' ,req.body.sender_id , req.body.target_id, doc._id);
            res.send({status : 'success'});
        }
    });
})

app.post('/api/unLikeOnMemory', function (req, res) {
    var query = Memory.getUnlikeOnMemory(req.body);
    query.exec(function(error){
        if(error){
            console.log(error);
        } else {
            res.send({status : 'success'});
        }
    });
})

app.post('/api/getLikeList', function (req, res) {

    if ( !req.body.Memoryid || !req.body.sender_id )
        return res.status(400).send({error: "Missing parameter(s)"});

    var query = Memory.getLikeList(req.body);

    query.exec(function(error, memory){

        if(error){
            console.log(error.message);
            return res.status(500).send({error: "Internal error "});
        }

        if(!memory)
            return res.status(400).send({error: "Memory not exist"});

        query = users.findUserByUserId(req.body.sender_id);
        query.exec(function(error, User){
            if(error){
                console.log(error.message);
                return res.status(500).send({error: "Internal error "});
            }

            if(!User)
                return res.status(400).send({error: "User not exist"});

            fellowship_controller.getRelationShip(User, memory.likeByReader, function(result){
                res.send(result);
            });
        });

    });
})

app.post('/api/followRequest', function (req, res) {
    if(req.body.isPublic == 'true'){
        // console.log('public request listen');
        var query = users.follow_request_public(req.body);
        User.pushNoti('follower' ,req.body.sender_id , req.body.target_id);
    } else{
        // console.log('private request listen');
        var query = users.follow_request_private(req.body);
        User.pushNoti('follower_request' , req.body.sender_id, req.body.target_id);
    }

    //insert follower or insert being request for requestee
    query[0].exec(function(err, rawRespone){
        if(err){
            console.log(err);
        }
    });

    //insert following or insert request for requester
    query[1].exec(function(err, rawRespone){
        if(err){
            console.log(err);
        }
    });

    res.send({status: 'success'});
})

app.post('/api/removeRequest', function (req, res) {
    var query = users.removeRequest(req.body);

    query[0].exec(function(err, rawRespone){
        if(err){
            console.log(err);
        }
    });

    query[1].exec(function(err, rawRespone){
        if(err){
            console.log(err);
        }
    });

    res.send({status: 'success'});
})

app.post('/api/unfollow', function (req, res) {

    var query = users.unfollow(req.body);

    //remove follower from requestee
    query[0].exec(function(err, rawRespone){
        if(err){
            console.log(err);
        }
    });

    //remove following from requester
    query[1].exec(function(err, rawRespone){
        if(err){
            console.log(err);
        }
    });

    res.send({status: 'success'});
})

app.post('/api/acceptFollow', function (req, res) {
    var query = users.acceptFollow(req.body);

    Async.each(query, function (item, end) {
        item.exec(function (err) {
            if(err){
                console.log(err)
            }
            end()
        })
    }, function (error) {
        res.send({status : "success", target_id: req.body.target_id});
    })

})

app.post('/api/denyFollow', function (req, res) {
    var query = users.denyFollow(req.body)

    Async.each(query, function (item, end) {
        item.exec(function (err) {
            if(err){
                console.log(err)
            }
            end()
        })
    }, function (error) {
        res.send({status : "success", target_id: req.body.target_id});
    })
})

app.post('/api/getProfile', function (req, res) {

    // console.log('Server Side : getProfile socket listen');

    var sender_id = req.body.sender_id;
    var target_id = req.body.target_id;

    var query = users.findUserByUserId(target_id);

    query.exec(function(err, user){

        if(err){
            console.log('Error occurs');
            return;
        }

        var result = {};

        result['username'] = user.username;
        result['email'] = user.email;
        result['following'] = user.following.length;
        result['follower'] = user.follower.length;
        result['memory'] = user.memories.length;
        result['status'] = user.status;
        result['profilePicture'] = user.profilePicture;
        result['backGroundPicture'] = user.backGroundPicture;
        result['isPublic'] = user.isPublic;
        result['phone'] = user.phone;

        query = users.findUserByUserId(sender_id);

        query.exec(function(error, User){

            if(error){
                console.log(error.message);
            }

            if(sender_id == target_id){
                result['relationship'] = 'yourself';
            } else {

                if(User.following.indexOf(target_id) > -1){
                    result['relationship'] =  'following';
                } else if(User.request.indexOf(target_id) > -1){
                    result['relationship'] =  'requested';
                } else {
                    result['relationship'] =  'nothing';
                }

            }


            res.send(result);
        });
    });

})

app.post('/api/getFollowingList', function (req, res) {

    var query = users.findUserByUserId(req.body.sender_id);
    var sender_info;

    query.exec(function(error, User){

        if(error){
            console.log(error.message);
        }

        sender_info = User;

        if(!error){
            query = users.findUserByUserId(req.body.target_id).populate('following', {username:1, email:1, isPublic:1, profilePicture:1});

            query.exec(function(err, User){

                if(error){
                    console.log(error.message);
                }

                if(!error){

                    var result = [];

                    console.log(User._doc.following)

                    for(var i=0;i<= User._doc.following.length;i++){
                        if( i == User._doc.following.length){
                            res.send(result);
                        } else {

                            var json = {}
                            json._id = User._doc.following[i]._id
                            json.email = User._doc.following[i].email
                            json.username = User._doc.following[i].username
                            json.profilePicture = User._doc.following[i].profilePicture
                            json.isPublic = User._doc.following[i].isPublic

                            if(User._doc.following[i]._id == req.body.sender_id){
                                json.relationship =  'yourself'
                            } else if(sender_info.following.indexOf(User._doc.following[i]._id) > -1){
                                json.relationship =  'following'
                            } else if(sender_info.request.indexOf(User._doc.following[i]._id) > -1){
                                json.relationship =  'request'
                            } else {
                                json.relationship =  'nothing'
                            }

                            result.push(json)

                        }
                    }
                }
            });
        }
    });
})

app.post('/api/getFollowerList', function (req, res) {

    var query = users.findUserByUserId(req.body.sender_id);
    var sender_info;

    query.exec(function(error, User){

        if(error){
            console.log(error.message);
        }
        //console.log(User);
        sender_info = User;

        if(!error){
            // 1 represents true
            // populate('follower', {username:1, email:1, isPublic:1}) : return only 3 these attributes
            query = users.findUserByUserId(req.body.target_id).populate('follower', {username:1, email:1, isPublic:1, profilePicture:1});

            query.exec(function(error, User){

                if(error){
                    console.log(error.message);
                }

                if(!error){

                    var result = [];

                    for(var i=0;i<= User.follower.length;i++){
                        if( i == User.follower.length){
                            res.send(result);
                            break;
                        }

                        var json = {}
                        json._id = User._doc.follower[i]._id
                        json.email = User._doc.follower[i].email
                        json.username = User._doc.follower[i].username
                        json.profilePicture = User._doc.follower[i].profilePicture
                        json.isPublic = User._doc.follower[i].isPublic

                        if(User._doc.follower[i]._id == req.body.sender_id){
                            json.relationship =  'yourself'
                        } else if(sender_info.following.indexOf(User._doc.follower[i]._id) > -1){
                            json.relationship =  'following'
                        } else if(sender_info.request.indexOf(User._doc.follower[i]._id) > -1){
                            json.relationship =  'request'
                        } else {
                            json.relationship =  'nothing'
                        }

                        result.push(json)

                    }
                }
            });
        }
    });
})

app.post('/api/getRequestList', function (req, res) {
    // console.log("Get request list socket listen");
    var query = users.findUserByUserId(req.body.target_id).populate('beingRequest', {username:1, email:1, profilePicture:1, _id:1, isPublic:1});
    query.exec(function(error, User){

        if(error){
            console.log(error.message);
        }

        res.send(User.beingRequest);
    });

})

app.post('/api/getRequestListNumber', function (req, res) {
    var query = users.findUserByUserId(req.body.target_id);

    query.exec(function(error, User){
        if(error){
            console.log(error.message);
        }
        res.send({length : User.beingRequest.length});
    });
})

app.post('/api/findRelevantUserByEmail', function (req,res) {

    var queryResult;
    var query = users.findUserByEmailPiece(req.body.key);

    if(req.body.key == ''){
        res.send([]);
    } else {
        query.exec(function(error, Users){
            if(error){
                console.log(error.message);
            }
            queryResult = Users;
            var sender_id = req.body.sender_id;
            query = users.findUserByUserId(sender_id);
            query.exec(function(error, user){
                if(error){
                    console.log(error.message);
                }
                fellowship_controller.getRelationShip(user, Users, function(result){
                    res.send(result);
                });
            });
        });
    }
})

app.post('/api/createSQ', function (req, res) {
    securityQuestion.createSQ(req.body.question, req.body.answer, req.body.user_id, req.body.user_pass, (status)=>{
        res.send(status);
    });
})

app.post('/api/getSQ', function (req, res) {
    securityQuestion.getSQ(req.body.user_email, (respone)=>{
        res.send(respone);
    });
})

app.post('/api/renewPass', function (req,res) {
    securityQuestion.changePassworBySQ(
        req.body.email,
        req.body.noOfQuestion,
        req.body.answer,
        req.body.newpass,
        (response)=>{
            res.send(response)}
    );
})

app.post('/api/systemInformation', function (req, res) {
    var object = { serverTime : Number(new Date()), serverVersion: 1 }
    res.send({status:'success', message : object})
})


app.post('/user/logout', function (req, res) {

    if (!req.body._id)
        return res.status(400).send({error: "Missing parameter(s)"});

    users.logout(req.body._id, function () {
        res.send({})
    });


})
