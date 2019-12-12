var express = require('express');
var extend = require('util')._extend;
// var deepcopy = require("deepcopy");


//{ _id:1, username:1, email:1, isPublic:1, profilePicture:1 }
var queryGetRelationShip = function (user, List, callBack){

  var result = [];

  for(var i=0;i< List.length;i++){
    if(List[i]._id+"" == user._id+""){
      //case that the user.id is equal the list id
      result.push({relationship: 'yourself' });
    } else if(user.following.indexOf(List[i]._id) > -1){
      //sender is following target
      result.push({relationship: 'following'})
      //sender is requesting target
    } else if(user.request.indexOf(List[i]._id) > -1){
      result.push({relationship: 'request'})
    } else {
      //sender no action on target
      result.push({relationship: 'nothing'})
    }

    result[i] = extend(List[i]._doc,result[i]);
  }
  return (callBack(result));
}

exports.getRelationShip = queryGetRelationShip;
