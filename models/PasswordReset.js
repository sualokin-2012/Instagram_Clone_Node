
//since we'll be creating a mongoose model for our post, we need to include the mongoose module
var mongoose = require('mongoose');

//we're building a POST object model in mongoose that we'll use elsewhere
module.exports = mongoose.model('PasswordReset', {
    userId: String,
    password: String, //this will be the hashed value of the password
    expires: Date 
});