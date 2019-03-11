
//since we'll be creating a mongoose model for our post, we need to include the mongoose module
var mongoose = require('mongoose');

//we're building a User object model in mongoose that we'll use elsewhere
module.exports = mongoose.model('User', {
    email: String,
    password: String, //this will be the hashed value of the password
    userName: String
  //  isValid: Boolean
});