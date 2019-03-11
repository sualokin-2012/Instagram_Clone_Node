
var mongoose = require('mongoose');

module.exports = mongoose.model('Follow',{
   userId: String,
   followId: String
  
});