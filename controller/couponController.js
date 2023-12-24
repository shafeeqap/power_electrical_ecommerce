const Coupon = require('../models/couponModel');
const Cart = require('../models/cartModel')




// Load View Coupon
const loadViewCoupon = async(req, res)=>{
    try {

        const couponItems = await Coupon.find();
        res.render('view-coupon',{
            message:'View Coupons',
            couponItems,
            couponAdded:req.session.couponAdded,
        })
        
    } catch (error) {
        console.log(error);
    }
};


// Load Add Coupon Page
const loadAddCoupon = async(req, res)=>{
    try {

        res.render('add-coupon',{message:'Add Coupon'})
        
    } catch (error) {
        console.log(error);
    }
};


// Add Coupon
const AddCoupon = async(req, res)=>{
    try {
        // console.log(req.body);
const {
    couponName,
    couponCode,
    discountAmount,
    validFrom,
    validTo,
    minimumSpend,
    usersLimit,
    description

}=req.body;

const couponData = await Coupon.findOne({couponName:couponName});

if(couponData){
    return res.json({success:false, message:'Coupon allready exist'})
}

if(!couponData){
    const coupon = new Coupon({
        couponName,
        couponCode,
        discountAmount,
        validFrom,
        validTo,
        minimumSpend,
        usersLimit,
        description
    });

    const result = await coupon.save();
    // console.log('Result',result);

    req.session.couponAdded=1
    res.redirect('/admin/view-coupon')

}else{
    req.session.couponAdded=1
    res.redirect('/admin/view-coupon')

}
        
    } catch (error) {
        console.log(error);
    }

};

// Load Edit Coupon Page
const loadEditCoupon = async(req, res)=>{
    try {

        const couponId = req.query.id

        const couponData = await Coupon.findOne({_id:couponId});
        // console.log('couponData',couponData);

        res.render('edit-coupon',{
            message:'Edit Coupon',
            couponData
        })
        
    } catch (error) {
        console.log(error);
    }
};

// Edit Coupon and Update
const editCoupon = async(req, res)=>{
    try {
        // const id = req.query.id;
        // console.log('id',id);

        const {
            couponName,
            couponCode,
            discountAmount,
            validFrom,
            validTo,
            minimumSpend,
            usersLimit,
            description
        
        }=req.body;

        const updatedCoupon = await Coupon.findOneAndUpdate({
            _id:req.query.id},
            {$set:{
                couponName:couponName,
                couponCode:couponCode,
                discountAmount:discountAmount,
                validFrom:validFrom,
                validTo:validTo,
                minimumSpend:minimumSpend,
                usersLimit:usersLimit,
                description:description
            }});
            
            res.redirect('/admin/view-coupon');
            // console.log('updatedCoupon',updatedCoupon);
        
    } catch (error) {
        console.log(error);
    }
};


// Delete Coupon by Admin
const deletecoupon = async(req, res)=>{
    try {
        // const id = req.query.id
        // console.log(id);

        const deleteCoupon = await Coupon.deleteOne({_id:req.query.id});
        // console.log('deleteCoupon',deleteCoupon);

        res.redirect('/admin/view-coupon')


    } catch (error) {
        console.log(error);
    }
};




// --------------------------------- Function for applying coupon on the user side (Checkout Page) ------------------------------------------//
const applyCoupon = async(req, res)=>{

    try {
        const userId = req.session.user_id;
        // console.log('userId',userId);
        const code = req.body.code
        console.log("code",code);

        req.session.code=code;

        const amount = Number(req.body.amount);
        // console.log('amonut',amount);

        const cartData = await Cart.findOne({userId:userId}).populate('products.productId');
        // console.log('cartData',cartData);

        let totalPrice=0;

        const userExist = await Coupon.findOne({
            couponCode:code,
            usedUsers:{$in:[userId]}
        });
        // console.log('userExist',userExist);

        if(cartData){
            if(cartData.products.length>0){
                const products = cartData.products
                // console.log('products',products);

                for(const product of products){
                    // console.log('products', product);
                    totalPrice+=product.quantity*product.price;
                    // console.log('totalPrice',totalPrice);
                }

            }
        };

        if(userExist){
            res.json({user:true});
        }else{
            const couponData = await Coupon.findOne({couponCode:code});

            if(couponData){
                if(couponData.usersLimit<=0){
                    res.json({limit:true});
                }else{
                    if(couponData.status==false){
                        res.json({status:true});
                    }else{
                        if(couponData.expiryDate<=new Date()){
                            res.json({date:true});
                        }else if(couponData.activationDate>=new Date()){
                            res.json({active:true});
                        }else{
                            if(couponData.minimumSpend>=amount){
                                res.json({cartAmount:true});
                            }else{
                                const disAmount = couponData.discountAmount;

                                const disTotal = Math.round(totalPrice-disAmount);

                                req.session.Amount = disTotal;
                                const applied = await Cart.updateOne({
                                    userId:userId
                                },{$set:{applied:'applied'}});

                                return res.json({amountOkey:true, disAmount, disTotal});
                            }
                        }
                    }
                }
            }else{
                res.json({invalid: true});
            }
        }

        
    } catch (error) {
        console.log(error);
    }
}


// -----------------------------------------------------Delete Applied Coupon-----------------------------------------------------// 

const deleteAppliedCoupon = async(req, res)=>{
    try {

        const userId = req.session.userId
        const code = req.body.code;
        // console.log('code', code);

        const couponData = await Coupon.findOne({couponCode:code})
        const amount = Number(req.body.amount);
        const disAmount = couponData.discountAmount;
        const disTotal = Math.round(amount + disAmount);
        const deletApplied = await Cart.updateOne(
            {userId:userId},
            {$set:{applied:'not'}}
        );

        if(deletApplied){
            res.json({success:true, disTotal});
        }
        
    } catch (error) {
        console.log(error);
    }
};


module.exports={
    loadViewCoupon,
    loadAddCoupon,
    AddCoupon,
    loadEditCoupon,
    editCoupon,
    deletecoupon,
    applyCoupon,
    deleteAppliedCoupon
}