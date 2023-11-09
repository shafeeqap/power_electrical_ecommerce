const express = require('express');
const user_router = express();

const session = require('express-session');

const config = require('../config/config');

const userController = require('../controller/userController');

const path = require('path');
const userAuth = require('../middlewares/userAuth');

user_router.set('view engine', 'ejs');
user_router.set('views','./views/users');

user_router.use(session({secret:config.sessionSecret}));
user_router.use(express.static(path.join(__dirname, 'public')));
user_router.use(express.json());
user_router.use(express.urlencoded({extended:true}));


const multer = require('multer');
//-----------multer-------------------------//
const storage = multer.diskStorage({
  destination:function(req,file,cb){
    cb(null,path.join(__dirname,'../public/userImages'));
  },
  filename:function(req,file,cb){
    const name = Date.now()+'-'+file.originalname;
    cb(null,name);
  }
});
const upload = multer({storage:storage});
//------------------------------------------//

user_router.get('/register', userAuth.isLogout,userController.loadRegister);
user_router.post('/register', userAuth.isLogout,upload.single('image'),userController.insertUser);

user_router.get('/verify',userController.verifyMail);

user_router.get('/', userAuth.isLogout, userController.loginLoad)
user_router.get('/login', userAuth.isLogout,userController.loginLoad);

user_router.post('/login', userAuth.isLogout,userController.verifyLogin);

user_router.get('/home', userAuth.isLogin, userController.loadHome);
user_router.get('/logout',userAuth.isLogin,userController.userLogout);

user_router.get('/product',userController.productLoad);
user_router.get('/forget-password',userAuth.isLogout,userController.forgetPassword)
user_router.post('/forget-password',userController.forgetVerify);

user_router.get('/reset-password',userAuth.isLogout,userController.resetPasswordLoad)
user_router.post('/reset-password',userController.resetPassword)

user_router.get('/verification', userController.verificationLoad);
user_router.post('/verification', userController.sendVerificationLink)


module.exports = user_router;
