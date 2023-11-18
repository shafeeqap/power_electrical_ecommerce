const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const otpGenerator = require('otp-generator');
const randomstring = require('randomstring');
const Category = require('../models/categoryModel');
const Product = require('../models/productModel');

const config = require('../config/config');

// securePassword (bcrypt)----------------------//
const securePassword = async(password)=>{
    console.log("sec");
    console.log(password);
    try {
        const passwordHash = await bcrypt.hash(password, 10);
        return passwordHash;
    } catch (error) {
        console.log(error);
    }
}


// for send mail
const sendVerifyMail= async(email, otp)=>{
    try {

        const transporter = nodemailer.createTransport({
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
            subject:'For OTP Vrification mail',
            html: `<p> Hi , your OTP is <strong>${otp}</strong>.</p> `,
           
        };
        console.log(email)
        
        await transporter.sendMail(mailoption);
        // const info = await transporter.sendMail(mailOptions);
        // console.log("Email has been sent:", info.response);
        
    } catch (error) {
        console.error("Error sending email:", error);
        throw error; 
        // console.log(error.message);
    }
};

// Load OTP Verification 
const loadOtp = async(req,res)=>{
    try {
        // console.log("ot entered")
        
        const user = await User.findById(req.session.user_id);

        res.redirect('user-otp',{title:'User-OTP-Verification',user});
        
    } catch (error) {
        console.log(error);
    }
};

// Verify OTP
const verifyOtp = async (req, res) => {
    try {
        // Generate OTP
        const otpCode = otpGenerator.generate(6, {
            digits: true,
            alphabets: false,
            specialChars: false,
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
        });

        // console.log("otp code is: ",otpCode)

        const creationTime = Date.now() / 1000;
        const expirationTime = creationTime + 30;
        // Check if the email already exists in the database.

        const userCheck = await User.findOne({ email: req.body.email });
        const mobileCheck = await User.findOne({mobile:req.body.mobile});
        const emailMessage = userCheck ? 'Email is already exist' : '';
        const mobileMessage = mobileCheck ? 'Mobile is already exist' : '';

        if (userCheck) {
            res.render('register', {message:'Your registration is failed.',
            emailMessage :'Email is already exist',
            mobileMessage :'Mobile is already exist'});
        } else {
            // console.log("in");
            // console.log(req.body.password);
            // console.log(req.body.name);
            const spassword = await securePassword(req.body.password);
            // console.log("pass");

            req.session.name = req.body.name;
            req.session.email = req.body.email;
            req.session.mobile = req.body.mobile;

            if (req.body.name && req.body.email && req.body.mobile) {
                if (req.body.password === req.body.verify_password) {
                    req.session.password = spassword;

                    req.session.otp = {
                        code: otpCode,
                        expiry: expirationTime,
                    };

                    // console.log("out")

                    // console.log(req.session.email);
                    // console.log(req.session.email);

                    // Send OTP to the user's email
                    sendVerifyMail(req.session.email, req.session.otp.code);
                    res.render('user-otp', { message: 'Email OTP has been sent to your email', user: req.session.user_id });


                } else {
                    res.render('register', { message: 'Password does not match',emailMessage ,mobileMessage :''});
                }
            } else {
                res.render('register', { message: 'Please enter all details',emailMessage ,mobileMessage :''});
            }
        }

    } catch (error) {
        console.log(error);
    }
};



//  Resend OTP after expire time
const resendOtp = async(req,res)=>{ 
    try {
        const currentTime = Date.now() / 1000;

        if(req.session.otp.expire !=null){
            if(currentTime>req.session.otp.expire){
                const newDigit = otpGenerator.generate(6,{
                    digits: true,
                    alphabets: false,
                    specialChars: false,
                    upperCaseAlphabets: false,
                    lowerCaseAlphabets: false,
                });
                req.session.otp.code=newDigit;
                const newExpiry=currentTime+60;
                req.session.otp.expire=newExpiry;
                sendVerifyMail(req.body.name, req.body.email,req.body.mobile, req.session.otp.code);
                res.redirect('user-otp', { message: 'New OTP send into your Email', user: req.session.user_id });


            }else{
                res.render('user-otp', { message: 'Email Verified', _req:session.user_id });
            }
        }else{
            res.render('user-otp',{message:'Already registerd'})
        }

        
    } catch (error) {
        console.log(error);
    }
}



// view sign up page ---------------//
const loadRegister= async(req,res)=>{
    try {
        res.render('register',{ emailMessage: '' ,mobileMessage :''});
    } catch (error) {
        console.log(message);
    }
}

// user registration-------------//
const insertUser = async(req,res)=>{
    try {
      

         const creationTime = Math.floor(Date.now()/1000)
         if(req.body.otp === req.session.otp.code ){
            // console.log("oooooooooooooo");
            const user = new User({
                name:req.session.name,
                email:req.session.email,
                mobile:req.session.mobile,
                // image:req.file.filename,
                password:req.session.password,
                is_varified:1,
                is_admin:0
                
            });

            const userData = await user.save();
            console.log(userData)

            if(userData){
                res.render('login',{message:'Your registration is success.'});
            }else{
                res.render('register',{message:'Your registration is failed.',emailMessage: '',mobileMessage:'' });
            }

        }
        
    } catch (error) {
        console.log(error);
    }
};

//for reset password send mail
const sendResetPasswordMail= async(name,email,token)=>{
    try {
        const transporter = nodemailer.createTransport({
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
        transporter.sendMail(mailoption, function(error, info){
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
            return res.render('login',{message:'Please enter email'})
        }

        const userData = await User.findOne({email:email});

        if(userData){
            const passwordMatch = await bcrypt.compare(password, userData.password);
            if(passwordMatch){
                if(userData.is_varified === 0){
                    res.render('login', {message:"Please verify your mail."});

                }else{
                    req.session.user_id = userData._id;
                    res.redirect('/home');
                }

            }else{
                res.render('login', {message:"Email and password is incorrect."});
            }    

        }else{
            res.render('login', {message:"Email and password is incorrect."});
        }

    } catch (error) {
        console.log(error);
        
    }
}

// Load Home page
const loadHome = async(req,res)=>{
    try {
        const categoryData = await Category.find({is_block:true}); // Fetch form database
        const productData = await Product.find({is_active:true});
        const user = await User.findById(req.session.user_id);

        res.render('home',{
            user,
            categoryData,
            productData,
            title:'Home'}); 


    } catch (error) {
        console.log(error);
        
    }
}

// Load Product
const productLoad = async(req,res)=>{
    try {

        const user =  await User.findById(req.session.user_id);
        const productData = await Product.find({is_active:true});
        const categoryData = await Category.find({is_block:true});

        res.render('product', {
            user,
            productData,
            categoryData,
            title:'Product'});


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
        res.render('forget-password',{user:req.session.user_id});
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




module.exports ={
    loadRegister,
    insertUser,
    loadOtp,
    verifyOtp,
    resendOtp,
    loginLoad,
    verifyLogin,
    loadHome,
    productLoad,
    userLogout,
    forgetPassword,
    forgetVerify,
    resetPasswordLoad,
    resetPassword,
}