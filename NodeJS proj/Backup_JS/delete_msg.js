/*
  Deprecated!
  The following snippet is commented out since the follower/following relationship =/= friend relationshup
  And Ken will create follower/following relationship instead
  This comment was left: 21.Nov.2016
*/

/*
  Becasue we eventually decided that the message would not be actually removed when the user want to delete a message.
  Instead, we mark the message as deleted in inbox or outbox by specigying the attributes, inboxDeleted/outboxDeleted.
  This snippet is just for backup, once we want to delete the message for real, then we can use this snippet again.
*/

// //Add friend by two users' email
// socket.on('add friend', function (requesterEmail, requesteeEmail) {
//     var requester = users.findUserByEmail(requesterEmail);
//     var requestee = users.findUserByEmail(requesteeEmail);
//
//     var promise = requester.exec();
//     promise.then(
//       function(requesterObj) {
//         requestee.exec(function(err, requesteeObj) {
//           requesterObj.friendRequest(requesteeObj._id, function (err, request) {
//             if (err) throw err;
//
//             console.log('request', request);
//           });
//         });
//       },
//       function(err){
//
//       }
//     );
// });
