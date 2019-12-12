var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var FileSchema = new Schema({

    link : {
        type:String,
        required: true,
        unique : true
    },

    created_at : {
        type: Date,
        default: Date.now
    }

});

var File = mongoose.model('File', FileSchema);

var createFile= function (link, callBack, errCallBack){

    var JSONObject = {link};
    var temp = new File(JSONObject);

    temp.save(function(err){
        if(err){
            console.log(err);
            errCallBack();
        } else {
            callBack(temp);
        }
    });
}

var findAndDrop = function ( link , callBack ) {
    File.findOneAndRemove(link, function (error, offer) {
        if (error){
            console.log(error)
            callBack({status:'fail'})
        } else if(offer == null){
            console.log(null)
        } else {
            callBack({status:'success'})
        }
    })
}

module.exports = {
    createFile, findAndDrop
}
