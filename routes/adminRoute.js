const express = require('express');
const admin_route = express();
const session = require('express-session');
const config = require('../config/config');
const adminAuth = require('../middlewares/adminAuth');



const path = require('path');
const multer = require('multer');

admin_route.set('view engine', 'ejs');
admin_route.set('views', './views/admin');

admin_route.use(session({secret:config.sessionSecret}));
admin_route.use(express.static(path.join(__dirname,'public')));
admin_route.use(express.json());
admin_route.use(express.urlencoded({extended:true}));

//----------------multer--------------------//
const storage = multer.diskStorage({
    destination:function(req,file,cb){
        cb(null,path.join(__dirname,'../public/adminAssets/images'));
    },
    filename:function(req,file,cb){
        const name=Date.now()+'-'+file.originalname;
        cb(null,name);
    }
});

const upload = multer({
    storage:storage,
});
//----------------------------------//


const adminController = require('../controller/adminController');
const categoryController = require('../controller/categoryController');
const productController = require('../controller/productController');


admin_route.get('/',adminAuth.isLogout,adminController.loadLogin);
admin_route.post('/',adminController.verifyLogin);

admin_route.get('/adminHome',adminAuth.isLogin,adminController.loadDashboard);
admin_route.get('/logout',adminAuth.isLogin,adminController.logout);
admin_route.get('/forget-password',adminAuth.isLogout,adminController.forgetLoad);
admin_route.post('/forget-password',adminAuth.isLogout,adminController.forgetverify);

admin_route.get('/reset-password',adminAuth.isLogout,adminController.resetPasswordLoad);
admin_route.post('/reset-password',adminController.resetPassword);


admin_route.get('/view-product',adminAuth.isLogin,productController.viewProduct);
admin_route.get('/add-product',productController.loadProduct);
admin_route.post('/add-product',upload.array('image',4),productController.addProduct);

admin_route.get('/view-category',adminAuth.isLogin,categoryController.viewCategory);
admin_route.get('/add-category',categoryController.addCategoryLoad);
admin_route.post('/add-category',upload.single('image'),categoryController.addCategory);

module.exports = admin_route
