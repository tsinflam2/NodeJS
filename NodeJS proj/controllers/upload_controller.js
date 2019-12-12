var express = require('express');
var app = express();
var router = express.Router('');
var formidable = require('formidable');
var fs = require('fs');
var util = require('util');
var User = require("../models/user.js");

var crypto = require("crypto");
var File = require("../models/file.js");

exports.uploadFile = function (req, res) {


    var form = new formidable.IncomingForm({
        uploadDir: __dirname + '/../public'
    });

    form.parse(req, function (err, fields, files) {

        console.log(fields, files)

        if (err) {
            console.log(err);
        }

        if (fields.MessageType == 'video') {
            fs.rename(files.tempthumb.path, form.uploadDir + "/" + fields.tempthumbLink);
        }

        fs.rename(files.File.path, form.uploadDir + "/" + fields.FileName + fields.FileExtenstion, function (error) {
            if (error) {
                console.log(error)
            } else {
                console.log(form.uploadDir + "/" + fields.FileName + fields.FileExtenstion)
                res.send({status: 'success'});
            }
        });

    });


};


exports.uploadFileToServer = function (req, res) {

    var form = new formidable.IncomingForm({
        uploadDir: __dirname + '/../public'
    });

    form.parse(req, function (error, fields, files) {
        if (error) {
            console.log(error)
        } else {
            var randomString = crypto.randomBytes(40).toString('hex')
            var finishFunction = function () {
                fs.rename(files.File.path, form.uploadDir + "/" + randomString, function (error) {
                    if (error) {
                        console.log(error)
                        res.send({status: 'fail'})
                    } else {
                        res.send({status: 'success', fileLink: randomString});
                    }
                });
            }

            File.createFile(randomString, finishFunction, function () {
                randomString = crypto.randomBytes(45).toString('hex');
                File.createFile(randomString, finishFunction, function () {
                    res.send({status: 'fail', message: 'Please try again'})
                })
            })

        }
    })
}

exports.deleteFileFromServer = function (req, res) {

    var fileLink = __dirname + '/../public/' + req.body.fileLink;

    File.findAndDrop(fileLink, function (response) {
        if (response == null) {
            res.send({status: 'success'})
        } else if (response.status == 'fail') {
            res.send({status: 'fail'})
        } else {
            fs.stat(fileLink, function (exists) {
                if (!exists) {
                    console.log("File exists")
                    fs.unlink(fileLink, function () {
                        res.send({status: 'success'})
                    })
                } else {
                    console.log("File not exists")
                    res.send({status: 'success'})
                }
            })
        }
    })

}

exports.uploadProfilePic = function (req, res) {

    console.log("Visit of uploadProfilePic saw");

    var form = new formidable.IncomingForm({
        uploadDir: __dirname + '/../public/profile'
    });

    form.parse(req, function (error, fields, files) {

        if (error) {
            console.log(error);
        }

        var destinatedFilePath = form.uploadDir + "/" + fields.user_id + fields.extention;

        if (fs.existsSync(destinatedFilePath)) {
            fs.unlinkSync(destinatedFilePath);
        }

        fs.rename(files.File.path, destinatedFilePath, function (error) {
            if (error) {
                console.log(error)
            } else {
                res.send("{status:success}");
            }
        });


        var query = User.queryRenewProfilePicture(fields.user_id, fields.user_id + fields.extention);

        query.exec(function (err) {
            if (error) {
                console.log(error);
            } else {
                console.log('Query Success');
            }
        });


    });


};


exports.uploadProfileBackground = function (req, res) {

    console.log("Visit of uploadProfilePicBackground saw");

    var form = new formidable.IncomingForm({
        uploadDir: __dirname + '/../public/profileBackground'
    });

    form.parse(req, function (error, fields, files) {

        if (error) {
            console.log(error);
        }

        var destinatedFilePath = form.uploadDir + "/" + fields.user_id + fields.extention;

        if (fs.existsSync(destinatedFilePath)) {
            fs.unlinkSync(destinatedFilePath);
        }

        fs.rename(files.File.path, destinatedFilePath, function (error) {
            if (error) {
                console.log(error)
            } else {
                res.send("{status:success}");
            }
        });
        // res.end(util.inspect({
        //   fields: fields,
        //   files: files
        // }));

        var query = User.queryRenewProfileBackground(fields.user_id, fields.user_id + fields.extention);

        query.exec(function (err) {
            if (error) {
                console.log(error);
            } else {
                console.log('Query Success');
            }
        });


    });


};

// module.exports = router;
