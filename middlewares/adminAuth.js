const isLogin = async(req,res,next)=>{
    try {
        if(req.session.user_id){
            next();
        }
        else{
            res.redirect('/admin')
        }
        
        
    } catch (error) {
        console.log(error);
        res.status(500).send('Server Error');
    }
}

const isLogout = async(req,res,next)=>{
    try {
        if(req.session.user_id){
            redirect('/admin/adminHome')
        }
        next();
        
    } catch (error) {
        console.log(error);
    }
}

module.exports={
    isLogin,
    isLogout
}