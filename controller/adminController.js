const User = require('../models/userModel');
const Product = require('../models/productModel');

const loadLogin = async(req,res)=>{
    try {
        res.render('admin',{message:"Admin Page"})
    } catch (error) {
        console.log(error);
    }
}
const viewProduct = async(req,res)=>{
    try {
        const product = await Product.find();
        res.render('view-product',{message:'Product Details',product});
        
    } catch (error) {
        console.log(error);
    }
}

const loadProduct = async(req,res)=>{
    try {
       
        res.render('add-product',{message:'Add Product'});
    } catch (error) {
        console.log(error);
    }
}
const addProduct = async(req,res)=>{
    try {

        const name=req.body.name;
        const category=req.body.category;
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
    viewProduct,
    loadProduct,
    addProduct,
    getData
}