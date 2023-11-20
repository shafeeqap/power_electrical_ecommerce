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

// const fileFilter = (req, file, cb) => {
//     // Allow only image files
//     if (file.mimetype.startsWith('image/')) {
//       cb(null, true);
//     } else {
//       cb(new Error('Only image files are allowed!'), false);
//     }
//   };

const upload = multer({
    storage:storage,
    fileFilter:(req,file,cb)=>{
        if(file.mimetype==="image/png"||
            file.mimetype==="image/jpg"||
            file.mimetype==="image/jpeg"||
            file.mimetype==="image/webp"||
            file.mimetype==="image/avif"
        ){
            cb(null,true)
        }else{
            cb(null,false);
            return cb(new Error("Only .png, .jpg, .jpeg, .webp format allowed."));
        }
    }
});
//----------------------------------//


const adminController = require('../controller/adminController');
const categoryController = require('../controller/categoryController');
const productController = require('../controller/productController');
const brandController = require('../controller/brandController');


admin_route.get('/',adminAuth.isLogout,adminController.loadLogin);
admin_route.post('/',adminController.verifyLogin);
admin_route.get('/adminHome',adminAuth.isLogin,adminController.loadDashboard);
admin_route.get('/logout',adminAuth.isLogin,adminController.logout);

admin_route.get('/forget-password',adminAuth.isLogout,adminController.forgetLoad);
admin_route.post('/forget-password',adminAuth.isLogout,adminController.forgetverify);
admin_route.get('/reset-password',adminAuth.isLogout,adminController.resetPasswordLoad);
admin_route.post('/reset-password',adminController.resetPassword);

admin_route.get('/view-users',adminAuth.isLogin,adminController.viewUsers);
admin_route.get('/is_blockUser',adminController.userBlockorActive);

admin_route.get('/view-product',adminAuth.isLogin,productController.viewProduct);
admin_route.get('/add-product',adminAuth.isLogin,productController.loadAddProduct);
admin_route.post('/add-product',upload.array('image',4),productController.addProduct);
admin_route.get('/edit-product',adminAuth.isLogin,productController.editProductLoad);
admin_route.post('/edit-product',upload.array('image',4),productController.editProduct);
admin_route.get('/is_activeProduct',adminAuth.isLogin,productController.productListorUnlist);

admin_route.get('/view-category',adminAuth.isLogin,categoryController.viewCategory);
admin_route.get('/add-category',adminAuth.isLogin,categoryController.addCategoryLoad);
admin_route.post('/add-category',upload.single('image'),categoryController.addCategory);
admin_route.get('/edit-category',adminAuth.isLogin,categoryController.editCategoryLoad);
admin_route.post('/edit-category',upload.single('image'),categoryController.updateCategory);
admin_route.get('/is_blockCategory',adminAuth.isLogin,categoryController.categoryListorUnlist);

admin_route.get('/view-brand',adminAuth.isLogin,brandController.viewBrand);
admin_route.get('/add-brand',adminAuth.isLogin,brandController.addBrandLoad);
admin_route.post('/add-brand',upload.single('image'),brandController.addBrand);
admin_route.get('/edit-brand',adminAuth.isLogin,brandController.editBrandLoad);
admin_route.post('/edit-brand',upload.single('image'),brandController.editBrand);
admin_route.get('/is_blockBrand',brandController.brandListorUnlist);






module.exports = admin_route
