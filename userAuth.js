
const User = require('./models/User.js');
const LocalStrategy = require('passport-local').Strategy;
const hash = require('./utils/hash.js');

//encapsulate initialization of the passport functionality
module.exports.init = function(passport){
	// Passport needs to be able to serialize and deserialize users to support persistent login sessions
    console.log('init'); 
    passport.serializeUser(function(user, callback) {
        console.log('serializing user1: ' + user);
        console.log('serializing user2: ' + user.username);
        callback(null, user._id);
    })
    passport.deserializeUser(function(id, callback) {
        User.findById(id, function(err, user) {
            console.log('deserializing user1: ' + user);
            //console.log('deserializing user2: ' + user.username);
            console.log('deserializing user2: ' + user.email);
            callback(err, user);
        });
    });
    //set up the login handler
    passport.use('login', new LocalStrategy(handleLoginAttempt));
    //set up the signup handler
	passport.use('signup', new LocalStrategy(handleSignupAttempt));
	//console.log(passport);
} 

//encapsulate validating whether this session has an authenticated user
module.exports.isAuthenticated = function (req, res, next) {
    console.log('check if we have an authenticated user');
	// if user is authenticated in the session 
	if (req.isAuthenticated()){
	    console.log('we do authenticate');
        //allow them to proceed
        next();
    } else {
	    console.log('we do not authenticate');
        // if the user is not authenticated then redirect him to the login page
        res.redirect('/signin');
    }
}

//passport will call this function when someone attempts to log in
function handleLoginAttempt(email, password, cb){
    //don't log user's passwords in plain text to the console in production
    console.log('userAuth: handleLoginAttempt: email: ' + email + ' password: ' + password);
    Promise.resolve()
    .then(function(){
        //see if there's a user with this email
        return User.findOne({'email' : email});
    })
    .then(function(user){
        var param = false;
        //if the user exists and the hash of the password provided matches
        if (user && hash.isValid(user, password))
            //return the user object
            param = user;
        //execute the callback with appropriate parameters
        cb(null, param);
    })
    .catch(function(err){
        //even if something went wrong, we still need to call the callback
        console.log('userAuth: handleLoginAttempt: exception: ' + err);
        cb(err);
    });
}

//passport will call this function when someone attempts to join
function handleSignupAttempt(email, password, cb){
    
    //don't log user's passwords in plain text to the console in production
    
    console.log('userAuth: handleLoginAttempt: email: ' + email + ' password: ' + password);
    Promise.resolve()
    .then(function(){
        //see if there's a user with this email
        console.log('userAuth: handleSignupAttempt: email: ' + email + ' password: ' + password);
        return User.findOne({'email' : email});
    })
    .then(function(user){
        //if the user does not exist
        console.log("user->"+user);
        if (!user){
            //we can safely create one
            //storing a hash of the password
          
            Promise.resolve()
            .then(function(){
                user = new User();
                user.email = email;
                //user.userName = userName;
                user.password = hash.createHash(password);
                return user.save();
            })
            .then(function(user){
                //execute the callback with appropriate parameters
                cb(null, user);
            })
        } else {
            cb(null, false);
        }
    })
    .catch(function(err){
        //even if something went wrong, we still need to call the callback
        console.log('userAuth: handleSignupAttempt: exception: ' + err);
        cb(err);
    });
}