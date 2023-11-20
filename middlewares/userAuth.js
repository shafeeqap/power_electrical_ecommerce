

const isLogin = async(req,res,next)=>{
    try {
        if(req.session.user_id){}

        else{
            res.redirect('/');
        }
        next();
    } catch (error) {
        console.log(error);
        res.status(500).send('Server Error');
    }
}

const isLogout = async(req,res,next)=>{
    try {
        if(req.session.user_id){
            res.redirect('/home')
        }
        next()
    } catch (error) {
        console.log(error);
        res.status(500).send('Server Error');
    }
}

module.exports={
    isLogin,
    isLogout
}