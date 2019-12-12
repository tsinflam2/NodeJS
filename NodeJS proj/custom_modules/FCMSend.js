//Firebase Cloud Messaging
var FCM = require('fcm-node');
var serverKey = 'AAAA6OsgJDw:APA91bGfzBEecBnyW_6R7tKOhph9PPgFEG3iH7dGjMNL_7IbfW0IyVJd8_oLYZp0PkSnpW829XqiifvMdDkN7rATPHy9q7weR2NrH4whpvjB67v0D3Xlb4RsGY5B6USN_7WhoZzrIxSJ'
var fcm = new FCM(serverKey);
var  Async = require ('async')

//https://www.npmjs.com/package/async-polling
var AsyncPolling = require('async-polling');
var Message = require('../models/message.js');

//Require the user controller
var users_controller = require('../controllers/users_controller.js');

const sendingMessage = function ( user_id, callback ) {

    users_controller.findUserByID(user_id, function (user) {

        if (!user){
            console.log('404 USER NOT FOUND')
            return callback()
        }

        const message = {
            to: user.FCMToken,
            data: {
                type : 'messageReceived',
                message : 'You have received a new message'
            },
            priority: 'high'
        };

        if ( !user.userLogOut ){
            console.log(user.username, 'is logining' )
            fcm.send(message, function () {
                callback()
            })
        } else {
            console.log(user.username, 'is logout' )
            callback()
        }

    })

}

const notifyUnlockMessage = function () {

    AsyncPolling(function ( end ) {

        Message.getMSGCanBeOpen( function ( messages ) {

            Async.each(messages, function (message, finishHandleOneMessage) {

                console.log('message list length : ', messages.length)

                Async.each([
                    function ( finishSendOneFCM) {
                        users_controller.findUserByID (message.sendTo, function ( user ) {
                            console.log(user.username , 'is', (user.userLogOut)? 'logouted': 'logining')
                            if (!user.userLogOut){
                                var FCMmessage = { to: user.FCMToken, data: { type : 'messageReceivedUnlock', message : 'A new message has been unlocked'  } , priority: 'high' };
                                fcm.send(FCMmessage, function () {
                                    console.log('A message send to', user.username, FCMmessage.data)
                                    finishSendOneFCM()
                                })
                            } else {
                                finishSendOneFCM()
                            }
                        })
                    },
                    function ( finishSendOneFCM ) {
                        users_controller.findUserByID (message.sendFrom, function ( user ) {
                            console.log(user.username , 'is', (user.userLogOut)? 'logouted': 'logining')
                            if (!user.userLogOut){
                                var FCMmessage = { to: user.FCMToken, data: { type : 'messageSendUnlock', message : 'A message you sent has been unlocked'  } , priority: 'high' };
                                fcm.send(FCMmessage, function () {
                                    console.log('A message send to', user.username, FCMmessage.data)
                                    finishSendOneFCM()
                                })
                            } else {
                                finishSendOneFCM()
                            }
                        })
                    }
                ], function (item, finishSendOneFCM ) {
                    item(finishSendOneFCM)
                }, function (error) {
                    console.log('Finish handle message with id', message._id)
                    Message.updateMessageToUnlock(message._id, function () {
                        console.log('Setted message', message._id, 'to unlocked')
                        finishHandleOneMessage()
                    })
                })

            }, function () {
                end()
            })
        })
    }, 60000).run()
}

module.exports = {
    notifyUnlockMessage, sendingMessage
};


