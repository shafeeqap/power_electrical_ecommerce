const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const randomstring = require('randomstring');
const config = require('../config/config');
const nodemailer = require('nodemailer');


// securePassword (bcrypt)----------------------//
const securePassword = async(password)=>{
    try {
        const passwordHash = await bcrypt.hash(password, 10);
        return passwordHash;
    } catch (error) {
        console.log(error.message);
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
            html:'<p> Hi '+ name +', please click here to <a href="http://localhost:3000/admin/reset-password?token='+token+'"> Reset </a> your password.</p> '
            
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

// Load Login 
const loadLogin = async(req,res)=>{
    try {
        res.render('adminLogin')
    } catch (error) {
        console.log(error);
    }
}

// Verify Login
const verifyLogin = async(req,res)=>{
    try {
        const email=req.body.email;
        const password=req.body.password;
        const userDate=await User.findOne({email:email});
        if(userDate){
           const passwordMatch = await bcrypt.compare(password,userDate.password);

           if(passwordMatch){

                if(userDate.is_admin===0){
                    res.render('adminLogin',{message:'Email and Password incorrect'})

                }else{
                    req.session.user_id = userDate._id;
                    res.redirect('/admin/adminHome');
                }

           }else{
            res.render('adminLogin',{message:'Email and Password incorrect'})

           }
        }else{
            res.render('adminLogin',{message:'Email and Password incorrect'})
        }
    } catch (error) {
        console.log(error);
    }
}


// Load Home page
const loadDashboard = async(req,res)=>{
    try {
        res.render('adminHome',{message:"Admin Home"})
    } catch (error) {
        console.log(error);
    }
}

// Admin Logout
const logout = async(req,res)=>{
    try {
        req.session.destroy();
        res.redirect('/admin')

    } catch (error) {
        console.log(error);
    }
}

// Forget Password Load  
const forgetLoad = async(req,res)=>{
    try {

        res.render('forget-password',{message:''});
        
    } catch (error) {
        console.log(error);
    }
}

// Forget Password Vrify
const forgetverify = async(req,res)=>{
    try {
        const email = req.body.email;
        const userData = await User.findOne({email:email});
        
        if(userData){
            if(userData.is_admin===0){
                res.render('forget-password',{message:'Email incorrect'})

            }else{
                const randomString = randomstring.generate();
                const udatedData = await User.updateOne({email:email},{$set:{token:randomString}});
                sendResetPasswordMail(userData.name,userData.email,randomString);
                res.render('forget-password',{message:'Please check your email to reset your password'})
                    
            }

        }else{
            res.render('forget-password',{message:'Email incorrect'})
        }
    } catch (error) {
        console.log(error);
    }
}

// Reset Password Load
const resetPasswordLoad = async(req,res)=>{
    try {
        const token = req.query.token;
        const tokenData = await User.findOne({token:token});
        if(tokenData){
            res.render('reset-password',{user_id:tokenData._id});
        }else{
            res.render('404');
        }

    } catch (error) {
        console.log(error);
    }
}

// Reset password
const resetPassword = async(req,res)=>{
    try {
        const password = req.body.password;
        const user_id = req.body.user_id;

        const securePass = await securePassword(password);
        const updatedData = await User.findByIdAndUpdate({_id:user_id},{$set:{password:securePass,token:''}});

        res.redirect('/admin');

    } catch (error) {
        console.log(error);
    }
}


// View Users in Admin Dashboard
const viewUsers = async(req,res)=>{
    try {

        const userData = await User.find({ });
        console.log(userData);

        res.render('view-users',{message:'View Users',userData })
        
    } catch (error) {
        console.log(error);
    }

};

// Edit User Load
const userBlockorActive = async(req,res)=>{
    try {

        const user_id=req.query.id;
        // console.log(user_id);
       const userData = await User.findById({_id:user_id});
    //    console.log(userData);
    if(userData.is_block===true){

        await User.updateOne({_id:user_id},{$set:{is_block:false}});
        res.redirect('/admin/view-users')

    }else{
        await User.updateOne({_id:user_id},{$set:{is_block:true}});
        res.redirect('/admin/view-users');
    }

        
    } catch (error) {
        console.log(error);
    }
};



module.exports={
    loadLogin,
    verifyLogin,
    loadDashboard,
    logout,
    forgetLoad,
    forgetverify,
    sendResetPasswordMail,
    resetPasswordLoad,
    resetPassword,
    viewUsers,
    userBlockorActive,
    
}