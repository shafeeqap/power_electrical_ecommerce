const Admin = require('../models/adminModel');
const User = require('../models/userModel');
const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const bcrypt = require('bcrypt');
const randomstring = require('randomstring');
const config = require('../config/config');
const nodemailer = require('nodemailer');
const { now } = require('mongoose');
const { query } = require('express');

const { 
    findIncome,
    countSales,
    findSalesData,
    findSalesDataOfMonth,
    findSalesDataOfYear,
    formatNum,
} = require('../helpers/orderHelper');


// securePassword (bcrypt)----------------------//
const securePassword = async(password)=>{
    try {
        const passwordHash = await bcrypt.hash(password, 10);
        return passwordHash;
    } catch (error) {
        console.log(error.message);
    }
}

//for reset password send mail
const sendResetPasswordMail= async(name,email,token)=>{
    try {
        const transprter = nodemailer.createTransport({
            host:'smtp.gmail.com',
            port:587,
            secure:false,
            requireTLS:true,
            auth:{
                user:config.emailUser,
                pass:config.passwordUser
            }
        });
        const mailoption={
            from:config.emailUser,
            to:email,
            subject:'For Reset Password',
            html:'<p> Hi '+ name +', please click here to <a href="http://localhost:3000/admin/reset-password?token='+token+'"> Reset </a> your password.</p> '
            
        }
        transprter.sendMail(mailoption, function(error, info){
            if(error){
                console.log(error);
            }else{
                 console.log("Email has been sent :-", info.response);
            }
        })
        
    } catch (error) {
        console.log(error.message);
    }
}

//--------------------------------- Load Login ---------------------------------//
const loadLogin = async(req,res)=>{
    try {
        res.render('adminLogin')
    } catch (error) {
        console.log(error);
    }
}

// Verify Login
const verifyLogin = async(req,res)=>{
    try {
        const email=req.body.email;
        const password=req.body.password;
        const adminData=await Admin.findOne({email:email});
        if(adminData){
           const passwordMatch = await bcrypt.compare(password,adminData.password);
            // console.log('passmatch');
           if(passwordMatch){

                req.session.admin_id = adminData._id;

                res.redirect('/admin/adminHome')

           }else{
            res.render('adminLogin',{message:'Email and Password incorrect'})

           }
        }else{
            res.render('adminLogin',{message:'Email and Password incorrect'})
        }
    } catch (error) {
        console.log(error);
    }
}


// --------------------------------------------- Load Admin Home page -------------------------------------------------//
const loadDashboard = async (req, res) => {
    try {
        const today = new Date();
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const firstDayOfPreviousMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const jan1OfTheYear = new Date(today.getFullYear(), 0, 1);

        const totalIncome = await findIncome();
        const thisMonthIncome = await findIncome(firstDayOfMonth);
        const thisYearIncome = await findIncome(jan1OfTheYear);

        const totalUsersCount = formatNum(await User.find({}).count());
        const usersOntheMonth = formatNum(await User.find({ updatedAt: { $gte: firstDayOfMonth } }).count());

        const totalSalesCount = formatNum(await countSales());
        const salesOnTheYear = formatNum(await countSales(jan1OfTheYear));
        const salesOnTheMonth = formatNum(await countSales(firstDayOfMonth));
        const salesOnPrevMonth = formatNum(await countSales(firstDayOfPreviousMonth, firstDayOfPreviousMonth));



        // const dailyOrders = await Order.aggregate([
        //     {
        //         $match:{
        //             "date":{ $gte: startDate, $lte: endDate},
        //         },
        //     },
        //     {
        //         $group: {
        //             _id: {
        //                 dayOfWeek: { $dayOfWeek: "$date" },
        //             },
        //             totalAmount: { $sum: "$totalAmount" },
        //             count: { $sum: 1 },
        //         },
        //     },            
        //     {
        //         $sort: {
        //             "_id.dayOfWeek": 1,
        //         }
        //     }
        // ]);

        

        // Prepare data for the chart
        // const labels = ["M", "T", "W", "T", "F", "S", "S"];
        // const salesData = Array(7).fill(0);

          
        // dailyOrders.forEach((order) => {
        //     const dayOfWeek = order._id.dayOfWeek - 1; 
        //     salesData[dayOfWeek] = order.totalAmount;
        // });
        // console.log('salesData',salesData);

        // const shortFormSalesData = salesData.map(amount => Math.floor(amount / 100));
        // const integerSalesData = shortFormSalesData[0]; // Since it's a single value, not an array
        
        
        // const dailyReport = { dailyOrders, labels, salesData, integerSalesData };
    
        // console.log('dailyRiport',dailyReport);

        // Fetch daily sales data from MongoDB
        const pipeline = [
            {
                $match: {
                    "products.orderStatus": "Delivered",
                    date: {
                        $gte: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0),
                        $lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 0, 0, 0),
                    },
                },
            },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: '$totalAmount' },
                    count: { $sum: 1 },
                },
            },
        ];

        const dailySalesData = await Order.aggregate(pipeline);

       

        const labels = ['today'];
        const salesData = [dailySalesData[0] ? dailySalesData[0].totalAmount : 0];
        const integerSalesData = [dailySalesData[0] ? dailySalesData[0].count : 0];

        res.render('adminHome', {
            message: "Admin Home",
            totalIncome,
            totalUsersCount,
            thisMonthIncome,
            thisYearIncome,
            usersOntheMonth,
            totalSalesCount,
            salesOnTheYear,
            salesOnTheMonth,
            salesOnPrevMonth,
            labels,
            salesData,
            integerSalesData,
        });

        
    } catch (error) {
        console.log(error);
        return res.status(500).send("Internal Server Error");
    }
};


// --------------------------------------------- Admin Logout -------------------------------------------------------//
const logout = async(req,res)=>{
    try {
        req.session.destroy();
        res.redirect('/admin')

    } catch (error) {
        console.log(error);
    }
}

// Forget Password Load  
const forgetLoad = async(req,res)=>{
    try {

        res.render('forget-password',{message:''});
        
    } catch (error) {
        console.log(error);
    }
}

// Forget Password Vrify
const forgetverify = async(req,res)=>{
    try {
        const email = req.body.email;
        const userData = await User.findOne({email:email});
        
        if(userData){
            if(userData.is_admin===0){
                res.render('forget-password',{message:'Email incorrect'})

            }else{
                const randomString = randomstring.generate();
                const udatedData = await User.updateOne({email:email},{$set:{token:randomString}});
                sendResetPasswordMail(userData.name,userData.email,randomString);
                res.render('forget-password',{message:'Please check your email to reset your password'})
                    
            }

        }else{
            res.render('forget-password',{message:'Email incorrect'})
        }
    } catch (error) {
        console.log(error);
    }
}

// Reset Password Load
const resetPasswordLoad = async(req,res)=>{
    try {
        const token = req.query.token;
        const tokenData = await User.findOne({token:token});
        if(tokenData){
            res.render('reset-password',{user_id:tokenData._id});
        }else{
            res.render('404');
        }

    } catch (error) {
        console.log(error);
    }
}

// Reset password
const resetPassword = async(req,res)=>{
    try {
        const password = req.body.password;
        const user_id = req.body.user_id;

        const securePass = await securePassword(password);
        const updatedData = await User.findByIdAndUpdate({_id:user_id},{$set:{password:securePass,token:''}});

        res.redirect('/admin');

    } catch (error) {
        console.log(error);
    }
}


// View Users in Admin Dashboard
const viewUsers = async(req,res)=>{
    try {

        // search
        var search='';
        if(req.query.search){
            search=req.query.search;
        }

        //Pagination
        var page=1;
        if(req.query.page){
            page=parseInt(req.query.page);
        }

        const limit=6;

        const userData = await User.find({ 
            $or:[
                {name:{$regex:'.*'+search+'.*', $options:'i'}},
                {email:{$regex:'.*'+search+'.*', $options:'i'}},
                {mobile:{$regex:'.*'+search+'.*', $options:'i'}}
            ]
        }).limit(limit*1).skip(Math.max((page-1)*limit,0)).exec();
        // console.log(userData);

        // count
        const count = await User.find({ 
            $or:[
                {name:{$regex:'.*'+search+'.*', $options:'i'}},
                {email:{$regex:'.*'+search+'.*', $options:'i'}},
                {mobile:{$regex:'.*'+search+'.*', $options:'i'}}
            ]
        }).countDocuments();


        res.render('view-users',{
            message:'View Users',
            userData,
            totalPages:Math.ceil(count/limit),  //Ex:- count of document/limit (9/6 = 1.5 => 2)
            currentPage:page,   // page 1
         });
        
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }

};

// Edit User Load
const userBlockorActive = async(req,res)=>{
    try {

        const user_id=req.query.id;
        
        const userData = await User.findById({_id:user_id});
    
    if(userData.is_block===true){

        await User.updateOne({_id:user_id},{$set:{is_block:false}});
        res.redirect('/admin/view-users')

    }else{
        await User.updateOne({_id:user_id},{$set:{is_block:true}});
        res.redirect('/admin/view-users');
    }
        
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
};


// ----------------------------------------- Load View Orders Page ----------------------------------------//
const loadViewOrders = async (req, res) => {
    try {
        const orderData = await Order.find().sort({date:-1});
        const productsArray = [];

        for (let order of orderData) {
            for (let productValue of order.products) {
                const productId = productValue.productId;
                const productData = await Product.findById(productId);
                const userDetails = await User.findOne({ name: order.userName });

                if (productData) {
                    productsArray.push({
                        user: userDetails,
                        product: productData,
                        orderDetails: {
                            _id: order._id,
                            userId: order.userId,
                            deliveryDetails: order.deliveryDetails,
                            date: order.date,
                            totalAmount: productValue.quantity * order.totalAmount,
                            orderStatus: productValue.orderStatus,
                            paymentStatus: productValue.paymentStatus,
                            statusLevel: productValue.statusLevel,
                            paymentMethod: order.paymentMethod,
                            quantity: productValue.quantity,
                        },
                    });
                }
            }
        }

        
        res.render('view-orders', {
            message: 'View Orders',
            orders: productsArray,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};




// ----------------------------------------------- View OrderDetails ----------------------------------------//
const viewOrderDetails = async(req, res)=>{
    try {
    
        const {orderId, productId}=req.query;
        
        if (!orderId || !productId) {
            return res.status(400).send("orderId and productId are required");
        }

        const orderDetails = await Order.findById(orderId);
        const productData = await Product.findById(productId);

        const productDetails = orderDetails.products.find((product)=>product.productId.toString()===productId);

        const productOrder={
            orderId: orderDetails._id,
            product: productData,
            _id:productDetails._id,
            orderStatus:productDetails.orderStatus,
            statusLevel:productDetails.statusLevel,
            paymentStatus:productDetails.paymentStatus,
            totalAmount:orderDetails.totalAmount,
            quantity:productDetails.quantity,
            paymentMethod:orderDetails.paymentMethod,
            deliveryDetails:orderDetails.deliveryDetails,
            date:orderDetails.date,

        }

    

        res.render('view-ordersDetails',{
            message:'View Order Details',
            products:productOrder,
            orderId,
            productId
        });
        
        
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
};

//----------------------------------------------- Change Order Status ---------------------------------------------//
const changeOrderStatus = async(req, res)=>{
    try {
        const {status, orderId, productId}=req.body;
        const orderDetails = await Order.findById(orderId);

        if(!orderDetails){
            return res.status(404).send('Order not found.');
        }

        const statusMap={
            Shipped:2,
            OutforDelivery:3,
            Delivered:4,
        };

        const selectedStatus=status
        const statusLevel=statusMap[selectedStatus]

        const productDetails = orderDetails.products.find((product)=>product.productId.toString()===productId);
   

        productDetails.statusLevel=statusLevel;
        productDetails.orderStatus=status;
        productDetails.updatedAt=Date.now();

        const result = await orderDetails.save();
        

        res.redirect(`/admin/view-ordersDetails?orderId=${orderId}&productId=${productId}`);

        
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
};

// ---------------------------------------------- cancel Order by admin-----------------------------------
const adminCancelOrder = async(req, res)=>{
    try {
        
        const orderId = req.body.orderId;
        const productId = req.body.productId;
      


        const orderData = await Order.findById(orderId);
       

        if (!orderData) {
            return res.status(404).json({ status: false, message: 'Order not found' });
        }

            const productInfo = orderData.products.find((product)=>product.productId.toString()===productId);
          

            if (!productInfo) {
                return res.status(404).json({ status: false, message: 'Product not found in the order' });
            }
        
        
            productInfo.orderStatus='Cancelled';
            productInfo.paymentStatus='Cancelled';
            productInfo.updatedAt= Date.now();

            await orderData.save();

            return res.json({status:true, message:'Order successfully cancelled'});
    

   
    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: false, message: 'Internal Server Error' });
    }

};





module.exports={
    loadLogin,
    verifyLogin,
    loadDashboard,
    logout,
    forgetLoad,
    forgetverify,
    sendResetPasswordMail,
    resetPasswordLoad,
    resetPassword,
    viewUsers,
    userBlockorActive,
    loadViewOrders,
    viewOrderDetails,
    changeOrderStatus,
    adminCancelOrder,

    
}