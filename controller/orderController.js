const Cart = require('../models/cartModel');
const User = require('../models/userModel');
const Product = require('../models/productModel');
const Address = require('../models/addressModel');
const Order = require('../models/orderModel');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { ObjectId } = require('mongodb');
const { log } = require('console');


// Create Razorpay instance
var instance = new Razorpay({
    key_id: process.env.key_id,
    key_secret: process.env.key_secret
});




const loadCheckOut = async(req,res)=>{
    try {

        const userId = req.session.user_id
        const userData = await User.findOne({_id:userId});
        // console.log('User ',userData);
        const cartData = await Cart.findOne({userId:userId}).populate("products.productId").exec();
        // console.log('Cart data',cartData);

        if (!cartData || !cartData.products) {
            console.log('Cart data or products not found');
            return res.status(400).send('Cart data or products not found');
        }

        const products = cartData.products
        // console.log(products);
     
        const cart = await Cart.findOne({userId:userId});
        // console.log('Cart',cart);
        const address = await Address.findOne({userId:userId})
        // console.log('address',address);

        let Total;

        const total = await Cart.aggregate([ 
            {$match:{userId:new ObjectId(userId)}},
            {$unwind: "$products"},
            {$project:{price:"$products.price", quantity:"$products.quantity"}},
            {$group:{_id:null, total:{$sum:{$multiply:["$quantity", "$price"]}}}}

        ]).exec();
        // console.log('Total',total);

        if (!total || !total[0] || total[0].total === undefined) {
            console.log('Total not found in aggregation result');
            return res.status(400).send('Total not found in aggregation result');
        }


        Total=total[0].total
        // console.log(Total);
        // console.log('Address',address);
        res.render('checkout',{
            user:userData,
            products,
            total:Total,
            address
        });
        
    } catch (error) {
        console.log(error);
    }
};

// Place Order
const placeOrder = async(req, res)=>{
    try {
        const userId = req.session.user_id
        const address = req.body.address
        const cartData = await Cart.findOne({userId:userId});
        const total = parseInt(req.body.total);
        const paymentMethod = req.body.payment;
        const userData = await User.findOne({_id:userId});
        const name = userData.name
        // console.log(name);
        // console.log('Total',total);
        // console.log('Address',address);
        
        const uniNum = Math.floor(Math.random()*900000)+100000;
        const status = paymentMethod==='COD' ? 'placed':'pending';
        const statusLevel = status==='placed' ? 1 : 0;
        // const walletBalance = userData.wallet;
        // let totalWalletBalance = userData.wallet-total
        // const productId = req.query.productId
        // console.log(productId);
        // const code = req.body.code
        
        const today = new Date();
        const deliveryDate = new Date(today);
        deliveryDate.setDate(today.getDate() +7);

        const cartProducts = cartData.products.map(productItem =>({
            productId:productItem.productId,
            quantity:productItem.quantity,
            orderStatus:'Placed',
            statusLevel:1,
            paymentStatus:'Pending',
            // 'returnOrderStatus.status':'none',
            // 'returnOrderStatus.reason':'none',
            // 'cancelOrderStatus.reason':'none'
        }))

        const order = new Order({
            deliveryDetails:address,
            uniqueId:uniNum,
            userId:userId,
            userName:name,
            paymentMethod:paymentMethod,
            products:cartProducts,
            totalAmount:total,
            date:new Date(),
            expectedDelivery:deliveryDate
        })

        const orderData = await order.save();
        // console.log('payment method',orderData);
        const orderid = order._id
        // console.log(cartData);
        if(orderData){
            // console.log(cartData);
            if(paymentMethod==='COD'){
                console.log('COD');
                // console.log(cartData);
                for(const item of cartData.products){
                    const productId = item.productId._id;
                    // console.log('productId',productId);
                    const quantity = parseInt(item.quantity,10);
                    // console.log('quantity',quantity);
                    const result = await Product.updateOne({_id:productId},
                        {$inc:{qty:-quantity}}) //it will subtract the specified quantity from the existing value of the 'qty' field.
                        // console.log('Result',result);
                }
                res.json({success:true, orderid})

            }else{
            
                const orderId = orderData._id;
                console.log('Order Id',orderId);
                const totalAmount = orderData.totalAmount;
                console.log('Total Amount',totalAmount);
                if(paymentMethod==='onlinePayment'){
                    console.log('OnlinePayment');
                    var option ={
                        amount:totalAmount*100,
                        currency:"INR",
                        receipt: "" + orderId
                    };
                    instance.orders.create(option, (error, order) =>{
                        
                        if (error) {
                            console.error('Razorpay API error:', error);
                            res.status(500).json({ success: false, error: 'Razorpay API error' });
                        } else {
                            console.log('Razorpay Order:', order);
                            res.json({ order });
                        }

                    });

                }
                // else if(paymentMethod==='wallet'){
                //     if(walletBalance>=totalAmount){
                        
                        // const result = await User.findOneAndUpdate({_id:userId},
                        //     {$inc:{wallet:-totalAmount},
                        //     $push:{walletHistory:{
                        //     transactionDate:new Date(),
                        //     transactionAmount:total,
                        //     transactionDetails:"Purchased Product Amount.",
                        //     transactionType:"Debit",
                        //     currentBalance:totalWalletBalance
                        // }}},{new:true});

                        // console.log('Result',result);

                        // const orderUpdate = await Order.findByIdAndUpdate({_id:orderId},
                        //     {$set:{"products.$[].paymentStatus":"success"}});

                        //     // console.log('orderupdate',orderUpdate);

                        //     if(result){
                        //         const updated = await Cart.deleteOne({userId:req.session.user_id});
                        //         for(let i=0; i<cartProducts.length;i++){
                        //             const productId = cartProducts[i].productId;
                        //             const quantity = cartProducts[i].quantity;
                        //             await Product.findOneAndUpdate({_id:productId},
                        //                 {$inc:{qty:-quantity}});

                        //         }
                        //         res.json({success:true, orderid})
                        //         // console.log('updated',updated);
                        //     };
                           

                    // }else{
                    //     res.json({walletFailed:true});
                    // }

                // }
                
            }

            // Clear the user's cart after placing the order
            await Cart.findOneAndUpdate({ userId: userId }, { $set: { products: [] } });

        }else {
            // Handle the case when orderData is not available
            res.status(400).json({ error: 'Failed to place the order' });
        }


    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }

};

// Order Placed Page Load
const orderPlacedPageLoad = async(req, res)=>{
    try {
        const userId = req.session.user_id;
        const userData = await User.findOne({_id:userId});
        // console.log('User Data',userData);
        res.render('orderPlaced',{user:userData})
        
    } catch (error) {
        console.log(error);
    }
};


// Load Order Page
const loadOrderPage = async(req, res)=>{
    try {
        const userId = req.session.user_id
        const cartData = await Cart.findOne({userId:userId});
        const userData = await User.findOne({_id:userId});
        
        const orderData = await Order.find({userId:userId})

        // console.log('orderData',orderData);

        res.render('orders',{user:userData, orderData})
        
    } catch (error) {
        console.log(error);
    }
};

// Load Order Details
const orderDetails = async(req, res)=>{
    try {
        const id = req.query.id
        // console.log('Id',id);
        const userId = req.session.user_id
        const userData = await User.findOne({_id:userId})
        const orderData = await Order.findOne({_id:id}).populate('products.productId');
        
        console.log('Order Data',orderData);

        res.render('orderDetails',{user:userData, orders:orderData})
        
    } catch (error) {
        console.log(error);
    }
};

// Load Checkout Edit Addrss
const loadCheckoutEditAddress = async(req, res)=>{
    try {
        const id = req.query.id
        // console.log('Id',id);
        const userId = req.session.user_id
        const userData = await User.findById({_id:userId});
        let userAddress = await Address.findOne({userId:userId},
            {addresses:{$elemMatch:{_id:id}}});
            // console.log('User Address', userAddress);
            const address = userAddress.addresses
            // console.log('address',address[0]);
            res.render('editCheckoutAddress',{user:userData,address:address[0]})
        
    } catch (error) {
        console.log(error);
    }
};

// Edit Checkout Address
const editCheckoutAddress = async(req, res)=>{
    try {

        const addressId = req.body.id
        // console.log('address Id',addressId);
        const userId = req.session.user_id
        // console.log('user Id',userId);
        const updateAddress = await Address.updateOne({userId:userId,'addresses._id':addressId},
        {$set:{
            'addresses.$.fullName':req.body.fullName,
            'addresses.$.city':req.body.city,
            'addresses.$.country':req.body.country,
            'addresses.$.pincode':req.body.pincode,
            'addresses.$.state':req.body.state,
            'addresses.$.mobile':req.body.mobile
        }})

        res.redirect('/checkout');
        
        
    } catch (error) {
        console.log(error);
    }
};

//Load Order Status Page
const loadOrderStatus = async(req, res)=>{
    try {
        const id = req.query.id
        console.log('Status Id',id);
        const userId = req.session.user_id
        console.log('User Id', userId);

        
        if(!id || !userId){
            console.log('Invalid id or userId');
            return res.status(400).send('Invalid id or userId');
        }

        const userData = await User.findById({_id:userId});
        const orderData = await Order.find({_id:id});
        console.log('Order Data',orderData);
        // console.log('UserData',userData);

        if(!orderData){
            console.log('Order Data not found');
            return res.status(404).send('Order Data not found');
        };

        res.render('orderStatus',{user:userData})

    } catch (error) {
        console.log(error);
    }
}

module.exports={
    loadCheckOut,
    placeOrder,
    orderPlacedPageLoad,
    loadOrderPage,
    orderDetails,
    loadCheckoutEditAddress,
    editCheckoutAddress,
    loadOrderStatus
}