const Product = require('../models/productModel');
const Category = require('../models/categoryModel');


// View Product page
const viewProduct = async(req,res)=>{
    try {
        const product = await Product.find(); // Fetch data from database
        res.render('view-product',{message:'Product Details',product}); // passing product.
        
    } catch (error) {
        console.log(error);
        res.status(500).send('Server error');
    }
}
// Load add Product
const loadProduct = async(req,res)=>{
    try {
       
        const category = await Category.find();  // Fetch data from database
        res.render('add-product',{message:'Add Product',category}); // passing category.

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

// const getData = async(req,res)=>{
//     try {
//         const product = await Product.find();
//         res.json(product);
//     } catch (error) {
//         console.log(error);
//     }
// }

module.exports={
    viewProduct,
    loadProduct,
    addProduct,
    // getData

}