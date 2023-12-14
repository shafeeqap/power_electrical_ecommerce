
const User = require('../models/userModel');

const isLogin = async(req,res,next)=>{
    try {
        if(req.session.user_id){
            next();
        }

        else{
            res.redirect('/');
        }
        
    } catch (error) {
        console.log(error);
        res.status(500).send('Server Error');
    }
};


// Check user is blocked/not
const is_blocked = async(req, res, next)=>{
    try {

        const userData = await User.findById(req.session.user_id);
        // console.log('user data', userData);
        if(userData.is_block===true){

            res.render('login',{message:'Blocked By Admin'});
        }else{
            next();
        }

    } catch (error) {
        console.log(error);
    }
};

const isLogout = async(req,res,next)=>{
    try {
        if(req.session.user_id){
            res.redirect('/home')
        }else{
            next()
        }
        
    } catch (error) {
        console.log(error);
        res.status(500).send('Server Error');
    }
}

module.exports={
    isLogin,
    isLogout,
    is_blocked
}