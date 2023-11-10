const User = require('../models/userModel');
const Product = require('../models/productModel');
const bycrpt = require('bcrypt');


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
           const passwordMatch = await bycrpt.compare(password,userDate.password);

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

// View Product page
const viewProduct = async(req,res)=>{
    try {
        const product = await Product.find();
        res.render('view-product',{message:'Product Details',product});
        
    } catch (error) {
        console.log(error);
    }
}
// Load add Product
const loadProduct = async(req,res)=>{
    try {
       
        res.render('add-product',{message:'Add Product'});

    } catch (error) {
        console.log(error);
    }
}

// Add Product
const addProduct = async(req,res)=>{
    try {

        const name=req.body.name;
        const category=req.body.category;
        const brand=req.body.brand;
        const price=req.body.price;
        const qty=req.body.qty;
        const description=req.body.description;

         
        const image = []
        for(i=0;i<req.files.length;i++){
            image[i]=req.files[i].filename;
        }
        const newProduct = new Product({
            name:name,
            category:category,
            brand:brand,
            price:price,
            qty:qty,
            description:description,
            image:image
            
        });
        
        const result = await newProduct.save();
        console.log(result);
        res.redirect('view-product')
        
    } catch (error) {
        console.log(error);
        res.status(500).send('Server error');
    }
}
const getData = async(req,res)=>{
    try {
        const product = await Product.find();
        res.json(product);
    } catch (error) {
        console.log(error);
    }
}


module.exports={
    loadLogin,
    verifyLogin,
    loadDashboard,
    logout,
    viewProduct,
    loadProduct,
    addProduct,
    getData
}