const Category = require('../models/categoryModel');

// View Category Dashboard
const viewCategory = async(req,res)=>{
    try {
        const categoryData = await Category.find();   // Fetch categories from the database        
        // console.log(categoryData);
    
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
        // console.log(categoryData);

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

// Edit Category Load
const editCategoryLoad = async(req,res)=>{
    try {
        const id = req.query.id;
        // console.log(id);
        const categoryData = await Category.findById({_id:id});
        // console.log('Hello');
        if(categoryData){
            res.render('edit-category',{message:'Edit Category',categoryData});
        }else{
            res.redirect('/admin/view-category');
        }

    } catch (error) {
        console.log(error);
    }
}

// Update Category
const updateCategory = async(req,res)=>{
    try {
        
        const id = req.body.id;
        // console.log(id);
        const categoryData = await Category.findByIdAndUpdate({_id:id},
            {$set:{
                categoryName:req.body.category,
                description:req.body.description,
                image:req.file.filename,
                is_block: req.body.is_block,
            }});
            // console.log('Updated');
            if(categoryData){
                res.redirect('/admin/view-category');
            }else{
                res.render('edit-category');
            }
            

    } catch (error) {
        console.log(error);
    }
}

// Category List/Unlist
const categoryListorUnlist = async(req,res)=>{
    try {
        const id = req.query.id;
        // console.log(id);
        const categoryData = await Category.findById({_id:id});
        // console.log(categoryData);
        if(categoryData.is_block===true){
            await Category.updateOne({_id:id},{$set:{is_block:false}});
            // console.log('Blocked');
            res.redirect('/admin/view-category');
        }else{

            await Category.updateOne({_id:id},{$set:{is_block:true}});
            res.redirect('/admin/view-category');
        };
        


    } catch (error) {
        console.log(error);
    }
}
module.exports={
    addCategoryLoad,
    addCategory,
    viewCategory,
    editCategoryLoad,
    updateCategory,
    categoryListorUnlist
}