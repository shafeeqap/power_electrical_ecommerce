const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const Brand = require('../models/brandModel');


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
        const brandData = await Brand.find();
        res.render('add-product',{message:'Add Product',category,brandData}); // passing category.

    } catch (error) {
        console.log(error);
    }
}

// Add Product
const addProduct = async(req,res)=>{
    try {

        const name=req.body.name;
        const category=req.body.category;
        const brandName=req.body.brandName;
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
            brandName:brandName,
            price:price,
            qty:qty,
            description:description,
            image:image
            
        });
        
        const result = await newProduct.save();
        // console.log(result);
        res.redirect('view-product')
        
    } catch (error) {
        console.log(error);
        res.status(500).send('Server error');
    }
}


// Edit product Load
const editProductLoad = async(req,res)=>{
    try {
        const id = req.query.id;

        const productData = await Product.findById({_id:id});
        // console.log(productData);
        const category = await Category.find();
        // console.log('/////',category);
        const brandData = await Brand.find();
        res.render('edit-product',{message:'Edit Product',productData,category,brandData});
    } catch (error) {
        console.log(error);
    }
}

// Edit Product
const editProduct = async(req,res)=>{
    try {
        const id = req.body.id;
        // console.log(id);
        const productName = req.body.productName;
        const categoryName = req.body.categoryName;
        const brandName = req.body.brandName;
        const qty = req.body.qty;
        const description = req.body.description;
        const price = req.body.price;
        const image = [];

        for(i=0;i<req.files.length;i++){
            image[i]=req.files[i].filename;
        };

        const updatedData = await Product.findByIdAndUpdate({_id:id},
            {$set:{
                productName:productName,
                categoryName:categoryName,
                brandName:brandName,
                qty:qty,
                description:description,
                price:price,
                image:image,
                is_active:req.body.is_active
            }});
            // console.log(req.body);
            if(updatedData){
                res.redirect('/admin/view-product');
            }else{
                res.render('edit-product',{message:'Something went wrong'});
            }


    } catch (error) {
        console.log(error);        
    }
}

// Product List/Unlist
const productListorUnlist = async(req,res)=>{
    try {

        const id = req.query.id;
        // console.log(id);
        const productData = await Product.findById({_id:id});
        // console.log(productData);

        if(productData.is_active===true){
            await Product.updateOne({_id:id},{$set:{is_active:false}});
            
            res.redirect('/admin/view-product');
        }else{
            await Product.updateOne({_id:id},{$set:{is_active:true}});
            
            res.redirect('/admin/view-product');
        }


    } catch (error) {
        console.log(error);
    }
}

module.exports={
    viewProduct,
    loadProduct,
    addProduct,
    editProductLoad,
    editProduct,
    productListorUnlist

}