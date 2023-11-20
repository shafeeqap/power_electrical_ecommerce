const Cart = require('../models/cartModel');
const User = require('../models/userModel');
const Product = require('../models/productModel');


// Cart Page Load

const cartLoad = async(req,res)=>{
    try {

        const id = req.session.id
        // console.log(id);
        const user = await User.findById(req.session.user_id);
      

        res.render('cart',{user});
        
    } catch (error) {
        console.log(error);
    }
}

module.exports={
    cartLoad
}