const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const randomstring = require('randomstring')

const config = require('../config/config');

// securePassword (bcrypt)----------------------//
const securePassword = async(password)=>{
    try {
        const passwordHash = await bcrypt.hash(password, 10);
        return passwordHash;
    } catch (error) {
        console.log(error.message);
    }
}
// for send mail
const sendVerifyMail= async(name,email,user_id)=>{
    try {
        const transprter = nodemailer.createTransport({
            host:'smtp.gmail.com',
            port:587,
            secure:false,
            requireTLS:true,
            auth:{
                user:config.emailUser,
                pass:config.passwordUser
            }
        });
        const mailoption={
            from:config.emailUser,
            to:email,
            subject:'For Vrification mail',
            html:'<p> Hi '+name+ 'please click here to <a href="http://localhost:3000/verify?id='+user_id+'"> verify </a> your mail.</p> '
            

        }
        transprter.sendMail(mailoption, function(error, info){
            if(error){
                console.log(error);
            }else{
                 console.log("Email has been sent :-", info.response);
            }
        })
        
    } catch (error) {
        console.log(error.message);
    }
}

// verifyMail-------------------//
const verifyMail=async(req,res)=>{
    
    try {
        const updateInfo = await User.updateOne({_id:req.query.id},{$set:{is_varified:1}});
        console.log(updateInfo);
        res.render('email-verified');

    } catch (error) {
        console.log(error);
    }
}

// view sign up page ---------------//
const loadRegister= async(req,res)=>{
    try {
        res.render('register');
    } catch (error) {
        console.log(message);
    }
}

// user registration-------------//
const insertUser = async(req,res)=>{
    try {
      
        const spassword = await securePassword(req.body.password);
        const user = new User({
            name:req.body.name,
            email:req.body.email,
            mobile:req.body.mobile,
            image:req.file.filename,
            password:spassword,
            is_admin:0,
        });
        const userData = await user.save();
        if(userData){
            sendVerifyMail(req.body.name, req.body.email, userData._id);
            res.render('register',{message:'Your registration is successfull. Please verify your mail.'});
        }
        else{
            res.render('register',{message:'Your registration is failed.'});
        }
    } catch (error) {

        console.log(error);
    }
}

//for reset password send mail
const sendResetPasswordMail= async(name,email,token)=>{
    try {
        const transprter = nodemailer.createTransport({
            host:'smtp.gmail.com',
            port:587,
            secure:false,
            requireTLS:true,
            auth:{
                user:config.emailUser,
                pass:config.passwordUser
            }
        });
        const mailoption={
            from:config.emailUser,
            to:email,
            subject:'For Reset Password',
            html:'<p> Hi '+ name +', please click here to <a href="http://localhost:3000/reset-password?token='+token+'"> Reset </a> your password.</p> '
            

        }
        transprter.sendMail(mailoption, function(error, info){
            if(error){
                console.log(error);
            }else{
                 console.log("Email has been sent :-", info.response);
            }
        })
        
    } catch (error) {
        console.log(error.message);
    }
}

// Login user method
const loginLoad = async(req,res)=>{
    try {
        res.render('login');
    } catch (error) {
        console.log(error); 
    }
};

// Verify Login
const verifyLogin=async(req, res)=>{

    try {
        const email=req.body.email;
        const password=req.body.password;
        if(email===''){
            res.render('login',{message:'Please enter email'})
        }

        const userData = await User.findOne({email:email});

        if(userData){   
            const passwordMatch = await bcrypt.compare(password, userData.password);
            if(passwordMatch){
                if(userData.is_varified===0){
                    res.render('login', {message:"Please verify your mail."});

                }else{
                    req.session.user_id=userData._id;
                    res.redirect('/home');
                }

            }else{
                res.render('login', {message:"Email and password is incorrect."});
            }    

        }else{
            res.render('login', {message:"Email and password is incorrect."});
        }

    } catch (error) {
        console.log(message);
        
    }
}

// Load Home page
const loadHome = async(req,res)=>{
    try {
        res.render('home',{message:'Home'});
    } catch (error) {
        console.log(error);
        
    }
}

// Load Product
const productLoad = async(req,res)=>{
    try {
        res.render('product', {message:'Product'});
    } catch (error) {
        console.log(error);
    }
}

// User Logout
const userLogout = async(req,res)=>{
    try {
        req.session.destroy();
        res.redirect('/');
    } catch (error) {
        console.log(error);
    }
}

// Forget Password
const forgetPassword = async(req,res)=>{
    try {
        res.render('forget-password',{title:'Forget Password'});
    } catch (error) {
        console.log(error);
    }
}

// Forget Password Verify
const forgetVerify = async(req,res)=>{
    try {
        const email = req.body.email;
        if(email===''){
            res.render('forget-password',{message:'Please enter your email'})
            
        }
        const userData = await User.findOne({email:email});
        if(userData){
            if(userData.is_varified===0){
                res.render('forget-password',{message:'Please verify your email'});
            }else{
                const randomString = randomstring.generate();
                const updatedData = await User.updateOne({email:email},{$set:{token:randomString}});
                sendResetPasswordMail(userData.name,userData.email,randomString);
                res.render('forget-password',{message:'Please check your mail to reset your password.'});
            }
        }else{
            res.render('forget-password',{message:'Your email is in correct'});
        }
        
    } catch (error) {
        console.log(error);
        res.render('error', { message: 'An error occurred', status: 500 });
    }
}

// Reset Password Load
const resetPasswordLoad = async(req,res)=>{
    try {
        
        const token = req.query.token;

        if(!token){
            console.log('No tocken')
            return res.render('error', {message:'Token is invalid',status:404})
        }
        const tokenData = await User.findOne({token:token});

        if (!tokenData) {
            console.log('Second case')
            return res.render('error',{message:'Token is invalid',status:404});
            
        }else{
            console.log(tokenData)
            res.render('reset-password',{user_id:tokenData._id});
        
        }
        
    } catch (error) {
        console.log(error);
    }
}

// Reset Password
const resetPassword = async(req,res)=>{
    try {
        const password = req.body.password;
        const user_id = req.body.user_id;

        const secure_password = await securePassword(password); 

        const updatedData = await User.findByIdAndUpdate({_id:user_id},{$set:{password:secure_password,token:''}})
        res.redirect('/');

    } catch (error) {
        console.log(error);
    }
}

// for verification send mail link
const verificationLoad = async(req,res)=>{

    try {
        res.render('verification');
        
    } catch (error) {
        console.log(error);
    }
}

// Send Verification Link
const sendVerificationLink = async(req,res)=>{
    try {
        const email=req.body.email;
        const userData = await User.findOne({email:email})
        if(userData){
            sendVerifyMail(userData.name, userData.email, userData._id);
            res.render('verification',{message:'Reset verification mail sent your mail id ,please check.'});
        }else{
            res.render('verification',{message:'This email is not exit'});
        }
    } catch (error) {
        console.log(error);
    }
}

module.exports ={
    loadRegister,
    insertUser,
    verifyMail,
    loginLoad,
    verifyLogin,
    loadHome,
    productLoad,
    userLogout,
    forgetPassword,
    forgetVerify,
    resetPasswordLoad,
    resetPassword,
    verificationLoad,
    sendVerificationLink
}