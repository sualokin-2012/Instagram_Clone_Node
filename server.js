
//SimpleServer
const http = require('http');
const path = require('path');

//express related
const express = require('express');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const Guid = require('guid');

//session
const session = require('express-session');  
const mongoSession = require('connect-mongodb-session')(session);
const passport = require('passport');
const userAuth = require('./userAuth.js');
const hash = require('./utils/hash.js');

//database
const dbUrl = 'mongodb://Jung:1234abcd@ds064799.mlab.com:64799/instagram_clone_db';
const mongoose = require('mongoose');
const Post = require('./models/Post');
const Follow = require('./models/Follow');
const User = require('./models/User.js');
const PasswordReset = require('./models/PasswordReset.js'); 

//sendmail
const email = require('./utils/sendmail.js');
//
// ## SimpleServer `SimpleServer(obj)`
//
// Creates a new instance of SimpleServer with the following options:
//  * `port` - The HTTP port to listen on. If `process.env.PORT` is set, _it overrides this value_.
//
var router = express();
var server = http.createServer(router);

//establish connection to mongodb instance
mongoose.connect(dbUrl);

//create a sessions collection 
var mongoSessionStore = new mongoSession({
  uri: dbUrl,
  collection: 'sessions'
});

//tell the router (i.e. express) where to find static files
router.use(express.static(path.resolve(__dirname, 'client')));

//tell the router to parse JSON data for us and put it into req.body
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

//add session support
router.use(session({
  secret: process.env.SESSION_SECRET || 'mySecretKey', 
  store: mongoSessionStore,
  resave: true,
  saveUninitialized: false
}));

//add passport for authentication support
router.use(passport.initialize());
router.use(passport.session());
userAuth.init(passport);
router.use(fileUpload());

//tell the router to go first post page after login authorization
router.get('/signin', function(req, res){
  console.log('client requests signin..');
  res.redirect('/signin.html');
});

//tell the router to go first post page after login authorization
router.get('/signup', function(req, res){
  console.log('client requests signup');
  res.redirect('/signup.html');
});

//tell the router how to handle a post request from the signin page
router.post('/signin', function(req, res, next) {
  //tell passport to attempt to authenticate the login
  passport.authenticate('login', function(err, user, info) {
    //callback returns here
    if (err){
      //if error, say error
      res.json({isValid: false, message: 'internal error'});
    } else if (!user) {
      //if no user, say invalid login
      res.json({isValid: false, message: 'try again'});
    } else {
      //log this user in
      req.logIn(user, function(err){
        if (!err)
          //send a message to the client to say so
          res.json({isValid: true, message: 'welcome ' + user.email});
      });
    }
  })(req, res, next);
});

router.post('/signout', function(req, res){
  req.logout();
  res.json({});
  console.log("session id : " + req.session.id);
});

//tell the router how to handle a post request to the join page
router.post('/signup', function(req, res, next) {

    var email = req.body.username;
    var userName = req.body.userName;
    passport.authenticate('signup', function(err, user, info) {
    if (err){
      res.json({isValid: false, message: 'internal error'});    
    } else if (!user) {
      res.json({isValid: false, message: 'try again'});
    } else {
      //log this user in since they've just joined
      console.log("req.body.userName=>"+req.body.userName);
      console.log("req.user=>"+req.user);
      User.update({email:email},{userName:userName},function(err){
        console.log(userName + "is not saved!")
      });
      
      req.logIn(user, function(err){
        if (!err)
          //send a message to the client to say so
          res.json({isValid: true, message: 'welcome ' + user.email});
      });
    }
  })(req, res, next);
});

router.get('/passwordreset', (req, res) => {
  console.log('client requests passwordreset');
  res.sendFile(path.join(__dirname, 'client', 'passwordreset.html'));
});

router.post('/passwordreset', (req, res) => {
    Promise.resolve()
    .then(function(){
        //see if there's a user with this email
        console.log(req.body.email);
        return User.findOne({'email' : req.body.email});
    })
    .then(function(user){
     
      if (user){
        var pr = new PasswordReset();
        pr.userId = user.id;
        pr.password = hash.createHash(req.body.password);
        pr.expires = new Date((new Date()).getTime() + (20 * 60 * 1000));
        console.log("before1"+pr);
        pr.save()
        .then(function(pr){
          if (pr){
            email.send(req.body.email, 'password reset', 'https://test2-jkim789.c9users.io/verifypassword?id=' + pr.id);
          }
        });
      }
    })
});

router.get('/verifypassword', function(req, res){
    var password;
    console.log("verifing.. password");
    Promise.resolve()
    .then(function(){
      //console.log(req);
      console.log(req.body);
      console.log(req.query.id);
      return PasswordReset.findById(req.query.id);
    })
    .then(function(pr){
      console.log("verifing.. password2:"+ pr);
      if (pr){
        if (pr.expires > new Date()){
           console.log("here");
          password = pr.password;
          //see if there's a user with this email
          console.log("verifing.. password2:"+pr);
          return User.findById(pr.userId);
        }
      }
    })
    .then(function(user){
      console.log(user);
      if (user){
        user.password = password;
        console.log("verifing.. password3:"+user);
        return user.save();
      }
    })
    res.sendfile(path.join(__dirname, 'client','signin.html'))
});


//tell the router how to handle a get request to the posts page
router.get('/posts',function(req, res){
  console.log('client requests posts.html');
  //use sendfile to send our posts.html file
  res.sendFile(path.join(__dirname, 'client','posts.html'));
})

//request posts page (all posts from following users)
router.post('/posts',function(req, res){
   var loginId = '';
   console.log("req.user:"+req.user);
   if(req.user)
   { 
     loginId = req.user.id;
   }//if logged in

   Post.find().sort({userId:1,createdDate:-1})
  .then(function(paths){
    res.json({posts:paths,loginId:loginId});
    //console.log("session id : " + req.session.id);
  })
  .catch(function(err){
    console.log(err);
  })
});

//tell the router how to handle a get request to the posts page
router.get('/myPosts', userAuth.isAuthenticated, function(req, res){
  console.log('client requests myPosts.html');
  //use sendfile to send our posts.html file
  res.sendFile(path.join(__dirname, 'client','myPosts.html'));
});

//request myPosts 
router.post('/myPosts',userAuth.isAuthenticated, function(req, res){
  console.log("request myPosts");
  console.log("req:"+req.user);
  console.log("request user username:"+req.user.email);
  console.log("cookie info : " + res.cookie.length);
  console.log("session id : " + req.session.id);

  Post.find({userId:req.user.email}).sort({createdDate:-1})
  .then(function(paths){
    console.log('my post response1 ');
    //console.log(paths); 
    console.log('req.user.userName:'+req.user.userName);
    res.json({posts:paths,userName:req.user.userName});
  })
  .catch(function(err){
    console.log("err:"+err);
  })
});

//request user Posts 
router.post('/userPosts', function(req, res){
  console.log("request userPosts");
  console.log("req:"+req.userId);
  console.log("req:"+req.body.userId);
  var loginId = "";
  if(req.user)
  {
    loginId = req.user.id;
  }

  Post.find({userId:req.body.userId}).sort({createdDate:-1})
  .then(function(paths){
    res.json({posts:paths,loginId:loginId});
  })
  .catch(function(err){
    console.log("err:"+err);
  })
});

router.post('/follows',function(req, res){
  Follow.find({userId:"kjh@gmail.com"}).select("followId")
  .then(function(paths){
    console.log(paths);
    res.json(paths);
  })
  .catch(function(err){
    console.log(err);
  })
});


//tell the router how to handle a post request to /incrLike
router.post('/incrLike', userAuth.isAuthenticated, function(req, res){
  console.log('increment like for ' + req.body.id + ' by user ' + req.user.email+','+req.user.id);
  console.log('increment like for ' + req.body.id + ' by user ' + req.user.email+','+req.user);

  Post.findById(req.body.id)
  .then(function(post){
    //post.likeCount++;
    post.likeIds.push(req.user.id);
    post.save();
    //res.json({id: req.body.id, count: post.likeCount});  
    res.json({id: req.body.id,count: post.likeIds.length, alreadyLiked: true});
  })
  .catch(function(err){
    console.log(err);
  })
});  


//tell the router how to handle a post request to upload a file
router.post('/upload', userAuth.isAuthenticated, function(req, res) {
  
  var response = {success: false, message: ''};
  //console.log(req.body.comment);

  if (req.files){
    // The name of the input field is used to retrieve the uploaded file 
    var userPhoto = req.files.userPhoto;
    //invent a unique file name so no conflicts with any other files
    var guid = Guid.create();
    //figure out what extension to apply to the file
    var extension = '';
    switch(userPhoto.mimetype){
      case 'image/jpeg':
        extension = '.jpg';
        break;
      case 'image/png':
        extension = '.png';
        break;
      case 'image/bmp':
        extension = '.bmp';
        break;
      case 'image/gif':
        extension = '.gif';
        break;
    }
    
    //if we have an extension, it is a file type we will accept
    if (extension){ 
      //construct the file name
      var filename = guid + extension;
      // Use the mv() method to place the file somewhere on your server 
      userPhoto.mv('./client/img/posts/' + filename, function(err) {
        //if no error
        if (!err){
          //create a post for this image
          var post = new Post();
          post.userId = req.user.email;
          post.image = './img/posts/' + filename;
          post.likeCount = 0;
          post.comment = req.body.comment;
          post.feedbackCount = 0;
          post.userName = req.user.userName;
          //save it
          post.save()
          .then(function(){
            res.json({success: true, message: 'all good'});            
          })
        } else {
          response.message = 'internal error';
          res.json(response);
        }
      });
    } else {
      response.message = 'unsupported file type';
      res.json(response);
    }
  } else {
    response.message = 'no files';
    res.json(response);
  }
});

server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){
  var addr = server.address();
  console.log("Chat server listening at", addr.address + ":" + addr.port);
});
