const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const Brand = require('../models/brandModel');
const path = require('path');
const sharp = require('sharp');
const fs = require('fs');




// View Product page
const viewProduct = async (req, res) => {
    try {

        //Pagination
        let query = {};

        // Check if there is a search query in the URL
        if (req.query.search) {
            const searchRegex = new RegExp(req.query.search, 'i');
            query = {
                $or: [
                    { name: searchRegex },
                    { category: searchRegex },
                    { brandName: searchRegex },
                    { description: searchRegex },
                ]
            };
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const skip = (page - 1) * limit;

        const product = await Product.find(query).skip(skip).limit(limit);
        const totalCount = await Product.countDocuments(query);

        const totalPages = Math.ceil(totalCount / limit);

        res.render('view-product', {
            message: 'Product Details',
            product,
            searchQuery: req.query.search || '',
            pagination: {
                page,
                limit,
                totalCount,
                totalPages
            }
        });
    } catch (error) {
        console.log(error);
        res.status(500).send('Server error');
    }
};

// Load add Product
const loadAddProduct = async(req,res)=>{
    try {
       
        const category = await Category.find();  // Fetch data from database
        const brandData = await Brand.find();
        res.render('add-product',{message:'Add Product',category,brandData}); // passing category.

    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
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
        for(let i=0;i<req.files.length && i<4;i++){
            image[i] = req.files[i].filename;
            
        //     await sharp(path.join(__dirname,'../public/adminAssets/images',filename))
        //         .resize(300, 300)
        //         .toFile(path.join(__dirname,'../public/adminAssets/images', 'resized-'+filename));

        //     image[i]='resized-'+filename;
        }

        if(req.files.length>4){
            console.log("More than 4 images were uploaded. Only the first 4 will be processed.");
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
        res.redirect('/admin/view-product')
        
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
        const categoryName = req.body.category;
        const brandName = req.body.brand;
        const qty = req.body.qty;
        const description = req.body.description;
        const price = req.body.price;

        
        let image = [];

        // Check if files are uploaded
        if (req.files && req.files.length > 0) {
            for (let i = 0; i < req.files.length; i++) {
                const filename = req.files[i].filename;

                // Resize image to 300x300 pixels
                await sharp(path.join(__dirname, '../public/adminAssets/images', filename))
                    .resize(300, 300)
                    .toFile(path.join(__dirname, '../public/adminAssets/images', 'resized-' + filename));
            
                image[i] = 'resized-' + filename;

            }
        } else {
            // No new files uploaded, maintain existing image
            const existingProduct = await Product.findOne({_id:id});

            if (existingProduct && existingProduct.image) {
                if(Array.isArray(existingProduct.image)){

                    image = existingProduct.image;
                }else{
                    image = [existingProduct.image];
                }
            }
        }

        // console.log("Images:", image); // Corrected this line to log the 'image' variable


        const updatedData = await Product.findByIdAndUpdate(
            {_id:id},
            {$set:{
                name:productName,
                categoryName:categoryName,
                brandName:brandName,
                qty:qty,
                description:description,
                price:price,
                image:image,
                is_active:req.body.is_active
            }},{new:true});

            // console.log(updatedData);

            if(updatedData){
                res.redirect('/admin/view-product');
            }else{
                res.render('edit-product',{message:'Something went wrong'});
            }
        
        }catch (error) {
            console.error('Error in editProduct:', error);
            res.status(500).send('Internal Server Error');
    }
};

// Product List/Unlist
const productListorUnlist = async(req,res)=>{
    try {

        const id = req.query.id;
        // console.log(id);
        const productData = await Product.findById({_id:id});
        // console.log(productData);

        if (!productData) {
            // If the product is not found
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        let newIsActivated;

        if(productData.is_active===true){
            await Product.updateOne({_id:id},{$set:{is_active:false}});

            newIsActivated = false;
            
            // res.redirect('/admin/view-product');
        }else{
            await Product.updateOne({_id:id},{$set:{is_active:true}});

            newIsActivated = true;
            
            // res.redirect('/admin/view-product');
        }

        res.status(200).json({
            success: true,
            message: `Product ${newIsActivated ? 'listed' : 'unlisted'} successfully`,
            is_active: newIsActivated,
        });





    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

// Remove Images
const removeImage = async (req, res) => {
    try {
      const imageName = req.body.imageName;
    //   console.log('Image name', imageName);
  
      const imagePath = path.join(__dirname, 'public', 'adminAssets', 'images', imageName);
    //   console.log('imagePath', imagePath);
  
      const resizedImageName = 'resized-' + imageName;
      const resizedImagePath = path.join(__dirname, 'public', 'adminAssets', 'images', resizedImageName);
    //   console.log('resizedImagePath', resizedImagePath);
  
      const removeImageFile = (imagePath) => {
        fs.access(imagePath, fs.constants.F_OK, (err) => {
          if (!err) {
            // The file exists, so remove it
            fs.unlink(imagePath, (unlinkErr) => {
              if (!unlinkErr) {
                console.log(`Image removed successfully at: ${imagePath}`);
              } else {
                console.error(`Error removing image at ${imagePath}: ${unlinkErr}`);
              }
            });
          } else {
            console.log(`Image does not exist at: ${imagePath}`);
          }
        });
      };
  
      // Call the removeImageFile function for both paths
      removeImageFile(imagePath);
      removeImageFile(resizedImagePath);
  
      // Send success response
      return res.status(200).json({ message: 'Image removed successfully.' });
  
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  };
  



module.exports={
    viewProduct,
    loadAddProduct,
    addProduct,
    editProductLoad,
    editProduct,
    productListorUnlist,
    removeImage

}