const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/power_electricals');

const path = require('path');
const express = require('express');
const app=express();
const session = require('express-session');
// const MemoryStore = session.MemoryStore;
require('dotenv').config();


app.use(session({
  secret:process.env.SESSION_SECRET,
  resave:false,
  saveUninitialized:false,
}));


const port = process.env.port || 3000;

// const cookieParser = require('cookie-parser');
// const logger = require('morgan');


// view engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.use(cookieParser());


// for user routes
const userRoute = require('./routes/userRoute');
app.use('/', userRoute);

// for admin routes
const adminRoute = require('./routes/adminRoute');
app.use('/admin',adminRoute);


app.listen(port,()=>{
  console.log(`server is running.http://localhost:${port}`);
})

