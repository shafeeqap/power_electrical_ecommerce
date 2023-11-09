// !mdbgum

const mongoose = require('mongoose'); // Erase if already required

// Declare the Schema of the Mongo model
var userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
    },
    email:{
        type:String,
        required:true,
    },
    mobile:{
        type:String,
        required:true,
    },
    image:{
        type:String,
        required:true,
    },
    password:{
        type:String,
        required:true,
    },
    is_admin:{
        type:Number,
        required:true,
    },
    is_varified:{
        type:Number,
        default:0
    },
    token:{
        type:String,
        default:''
    }
});

//Export the model
module.exports = mongoose.model('User', userSchema);