
const nodemailer = require('nodemailer');

module.exports.send = function(to, subject, text){
   
    // create reusable transporter object using the default SMTP transport
    //let transporter = nodemailer.createTransport({
    let transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true, // secure:true for port 465, secure:false for port 587
        auth: {
            user: 'prog8165@gmail.com',
            pass: 'Prog8165!'
        }
    });
    
    // setup email data with unicode symbols
    //let mailOptions = {
    let mailOptions = {
        from: '"Instagram Clone" <prog8165@gmail.com>', // sender address
        to: to, // list of receivers
        subject: subject, // Subject line
        text: text // plain text body
    };
    
    // send mail with defined transport object
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log('Message %s sent: %s', info.messageId, info.response);
    });
}