const Cart = require('../models/cartModel');
const User = require('../models/userModel');
const Product = require('../models/productModel');
const { ObjectId } = require('mongodb');



// Add to Cart
const addToCart = async (req, res) => {
    try {
        // const user = await User.findById(req.session.user_id);

        if (req.session.user_id) {
            const productId = req.body.id;
            const name = req.session.user_id
            const userData = await User.findOne({_id:name})
            const user_Id = userData._id
            
            const productData = await Product.findById(productId);
            // console.log("product data",productData);

            const userCart = await Cart.findOne({ userId: user_Id });
            // console.log('User Cart', userCart);

            if (userCart) {

                // console.log('Product Data',productData)

                const productExist = userCart.products.findIndex(product => product.productId == productId);
                // console.log('Product Exist',productExist);


                if (productExist !== -1) {
                    const cartData = await Cart.findOne(
                        { userId: user_Id, "products.productId": productId },
                        { "products.productId.$": 1, "products.quantity": 1 }
                    );

                    const [{ quantity: existingQuantity }] = cartData.products;

                    if (productData.qty <= existingQuantity) {
                         res.json({ outofstock: true });
                    } else {
                        await Cart.findOneAndUpdate(
                            { userId: user_Id, "products.productId": productId },
                            { $inc: { "products.$.quantity": 1 } }
                        );
                    }
                } else {
                    await Cart.findOneAndUpdate(
                        { userId: user_Id },
                        { $push: { products: { productId: productId, 
                            price: productData.discountedPrice 
                            ? Math.ceil(productData.discountedPrice)    //if discount price 
                            :productData.price } } }    // if no discout, use regular price
                    );
                }
            } else {

                const data = new Cart({
                    userId: user_Id,
                    products: [{ productId: productId, price: productData.price }],
                });
                const cartData = await data.save();
            }
                res.json({ success: true });

        }else{

            res.json({ loginRequired: true });
        }

        
    } catch (error) {
        console.log(error);
        // Handle error response
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


// Cart Page Load

const cartLoad = async(req,res)=>{
    try {

        // console.log('Cart Load Route Called');

        const id = req.session.user_id

        // Find the user by ID
        const user = await User.findById({_id:id}); 
        // console.log('User Data',user);

        // Check if the user is not found
        if (!user) {
            return res.render('cart', { message: "User not found", cart: [], total: 0 });
        }

        const user_Id = user._id;
        // console.log('user data',user_Id);

        const cartData = await Cart.findOne({userId:user_Id}).populate("products.productId");
        // console.log('Cart data',cartData);

        if(req.session.user_id){

            if(cartData){
                // console.log('User==========',cartData);
                let Total;
                if(cartData.products !=0){
                    const total = await Cart.aggregate([
                        {$match: {userId :new ObjectId(user_Id)},
                    },
                    {$unwind:'$products'},

                    {$project:{price:'$products.price',quantity:'$products.quantity'}},

                    {$group:{_id:null, total:{$sum: {$multiply:["$quantity","$price"]}}}}]);

                    Total=total[0].total
                    // console.log('Total',Total);
                    // console.log('Cart============',cartData.products, Total);
                    res.render('cart',{user:user_Id, cart:cartData.products, userId:user_Id, total:Total});
                }else{
                    res.render('cart',{user:req.session.user, cart:[], total:0 });
                }
                
            }else{
                res.render('cart',{user:req.session.user, cart:[], total:0});
            }

        }else{
            res.render('cart',{message:"User Logged", cart:[], total:0});
        }
        
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
}

// Cart Quantity
const cartQuantity = async(req, res)=>{
    try {

        const user_Id = req.session.user_id;
        const productId = req.body.product;
        // console.log('product id',productId);
        const count = parseInt(req.body.count);

        const cartData = await Cart.findOne({userId:new ObjectId(user_Id),
            "products.productId":new ObjectId(productId)},
            {"products.productId.$":1, "products.quantity":1});
            
            console.log("Cart Data______",cartData);

        const [{quantity:quantity}]=cartData.products;

        const stockAvailable = await Product.findById({_id:new ObjectId(productId)})
        // console.log('stock Available');

        if(stockAvailable.quantity < quantity+count){
            return res.json({changeSuccess:false, message:'Insufficient stock'});

        }

        await Cart.updateOne({user:user_Id,"products.productId":productId},
        {$inc:{"products.$.quantity":count},
        $set:{"products.$.totalPrices":stockAvailable.price*(quantity+count)}});

        res.json({changeSuccess:true});

    } catch (error) {
        console.log(error);
        res.json({changeSuccess:false, message:'An error occurred'});
    }
}

// Cart Remove
const removeProduct = async(req,res)=>{
    try {
        const productId = req.body.product;
        // console.log('product Id');
        const user_Id = req.session.user_id;
        // const user_Id = user._id;

        const cartData = await Cart.findOneAndUpdate({"userId": user_Id, "products.productId":productId},
        {$pull:{products:{productId:productId}}} ,{new:true});

        if (cartData) {
            res.json({ success: true, cartData: cartData.products });
        } else {
            res.json({ success: false, message: 'Product not found in the cart.' });
        }
        
    } catch (error) {
        console.log(error);
    }
}

module.exports={
    cartLoad,
    addToCart,
    cartQuantity,
    removeProduct
}