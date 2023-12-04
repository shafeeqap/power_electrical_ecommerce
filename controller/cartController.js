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
            // console.log('Product Id',productId);
            const userId  = req.session.user_id
            const userData = await User.findOne({_id:userId })

            if (!userData) {
                // Handle case where user is not found
                return res.json({ error: 'User not found' });
            }

            const userCart = await Cart.findOne({ userId: userId });
            // console.log('User Cart', userCart);

            const productData = await Product.findById(productId);
            // console.log("product data",productData);


            if (userCart) {

                // console.log('Product Data',productData)

                const productExist = userCart.products.findIndex(product => product.productId == productId);
                // console.log('Product Exist',productExist);
                // res.json({warning:'Product Exist'})

                if (productExist !== -1) {
                    // console.log('jjjj');
                    const cartData = await Cart.findOne(
                        { userId: userId, "products.productId": productId },
                        { "products.productId.$": 1, "products.quantity": 1 }
                        
                    );

                    const [{ quantity: existingQuantity }] = cartData.products;

                    if (productData.qty <= existingQuantity) {
                         res.json({ outofstock: true });
                    } else {
                        await Cart.findOneAndUpdate(
                            { userId: userId, "products.productId": productId },
                            { $inc: { "products.$.quantity": 1 } }
                        );
                        // res.json({ success: true });
                    }
                } else {
                    await Cart.findOneAndUpdate(
                        { userId: userId },
                        { $push: { products: { productId: productId, 
                            price:productData.price}}});
                
                }


            } else {

                const data = new Cart({
                    userId: userId,
                    products: [{ 
                        productId: productId, 
                        price: productData.price }],
                });

                await data.save();
                
            }
            return res.json({ success: true });
                

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

        // const user_id  = req.session.user_id
        // Find user login/logout
        const user = await User.findById(req.session.user_id);

        // console.log('User', user);

        if (!user) {
            return res.render('cart', { message: "User not found", cart: [], total: 0 });
        }

        const user_Id = user._id;
        // console.log('user data',user_Id);

        const cartData = await Cart.findOne({userId:user_Id}).populate("products.productId");
        // console.log('Cart data',cartData);

        

        if(req.session.user_id){
            // console.log('User', user);
            if(cartData){
                // console.log('User==========',cartData);
                // console.log('User', user);

                let Total;
                if(cartData.products?.length){
                    const total = await Cart.aggregate([
                    {$match: {userId :new ObjectId(user_Id)},
                    },
                    {$unwind:'$products'},
                    {$project:{price:'$products.price',quantity:'$products.quantity'}},
                    {$group:{_id:null, total:{$sum: {$multiply:["$quantity","$price"]}}}}]);

                    Total=total[0]?. total || 0
                    // console.log('Total',total);
                    // console.log('Cart============',cartData.products, Total);
                    // console.log('User', user);
                    res.render('cart',{user, cart:cartData.products, userId:user_Id, total:Total});
                }else{
                    res.render('cart',{user, cart:[], total:0 });
                }
                
            }else{
                res.render('cart',{user, cart:[], total:0});
                // console.log('User', user);

            }

        }else{
            res.render('cart',{message:"User Logged", cart:[], total:0});
            // console.log('User', user);

        }
        
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
}

// Cart Quantity
const cartQuantity = async(req, res)=>{
    try {

        const userId = req.session.user_id;
        const productId = req.body.product;
        // console.log('product id',productId);
        const count = parseInt(req.body.count);
        // console.log('Count',count);

        const cartData = await Cart.findOne({userId:new ObjectId(userId),
            "products.productId":new ObjectId(productId)},
            {"products.productId.$":1, "products.quantity":1});
            
            // console.log("Cart Data______",cartData);

        const [{quantity:quantity}]=cartData.products;
        

        const stockAvailable = await Product.findById({_id:new ObjectId(productId)})
        // console.log('stock Available');

        if(stockAvailable.qty < quantity + count){
            return res.json({changeSuccess:false, message:'Insufficient stock'});

        }else{

            await Cart.updateOne({userId:userId,"products.productId":productId},
            {$inc:{"products.$.quantity":count}});
            res.json({changeSuccess:true});
        }
        
        const updateCartData = await Cart.findOne({userId:userId});
        // console.log('updateCartData',updateCartData);
        const updatedProduct = updateCartData.products.find((product)=>product.productId.toString()===productId.toString());
        // console.log('updatedProduct', updatedProduct);

        const updatedQuantity = updatedProduct.quantity
        // console.log('updateedquantity',updatedQuantity);
        const productPrice = stockAvailable.price;
        // console.log('Product Price',productPrice);
        const productTotal = productPrice*updatedQuantity
        // console.log('Product Total', productTotal);

        const prodcutTotal = await Cart.updateOne({userId:userId,"products.productId":productId},
        {$set:{"products.$.totalPrice":productTotal}})

        // console.log('prodcutTotal',prodcutTotal);

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