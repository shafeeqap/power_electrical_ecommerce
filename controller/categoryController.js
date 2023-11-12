const Category = require('../models/categoryModel');

// View Category Dashboard
const viewCategory = async(req,res)=>{
    try {
        const categoryData = await Category.find();   // Fetch categories from the database        
        console.log(categoryData);
    
        res.render('view-category',{message:'View Category',categoryData}); // passing categoryData
    
    } catch (error) {
        console.log(error);
        res.status(500).send('Server error');
    }
}

// Add new category Load
const addCategoryLoad = async(req,res)=>{
    try {
        
        res.render('add-category',{message:'Add Category'})

    } catch (error) {
        console.log(error);
    }
};

// Add new category
const addCategory = async(req,res)=>{
    try {
        const categoryName=req.body.categoryName;
        const description=req.body.description;
        const image=req.file.filename;

        const category=new Category({
            categoryName:categoryName,
            description:description,
            image:image
        
        })
        const categoryData = await category.save();
        console.log(categoryData);

        if(categoryData){
            
            res.redirect('/admin/view-category');
        }else{
        
            res.render('/admin/add-category',{message:'Something Wrong'});
        }
    } catch (error) {
        console.log(error);
        res.status(500).send('Server error');
    }
}


module.exports={
    addCategoryLoad,
    addCategory,
    viewCategory
}