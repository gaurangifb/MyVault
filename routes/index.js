const NodeRSA = require('node-rsa');
const encrypt = require('mongoose-encryption');
const methodOverride = require('method-override');
const express = require('express');
const router = require('express').Router();
const bcrypt = require('bcryptjs')
const masterPass = require('../models/master');
const connectDB = require('../db');
const { ensureAuth, ensureGuest, authCookie } = require('../middlewares/auth');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const passport = require('passport'); 
const session = require('express-session');
const flash = require('connect-flash');
const MongoStore = require('connect-mongo');
const cookieParser = require('cookie-parser')
const createPass = require('../models/createPass');


//const bodyParser = require('body-parser')
//const { stripTags } = require('../helpers/helper');


dotenv.config({ path: '../config.env' });   //configuring dot.env file

require('../passport')(passport);   //acquiring PASSPORT

connectDB();    //for connecting to the database

router.use(session({        //express session for storing sessions
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI })
  }));
router.use(flash());
router.use( express.static( "views" ) );
// router.use(bodyParser.json({limit: "50mb"}));
// router.use(bodyParser.urlencoded({limit: "50mb", extended: true, parameterLimit:50000}));
router.use(methodOverride('_method'));
router.use(passport.initialize());       //initializing passport for using it
router.use(passport.session());          //initializing passport.session for storing the sessions of user
router.use('/auth', require('./auth'));     //
router.use(express.json({limit: '5mb'}));
router.use(cookieParser())
router.use(express.urlencoded({ limit: '5mb', extended: true}));  //for the images, but not working


// router.use(function(req, res, next){
//     res.locals.sessionFlash = req.session.sessionFlash;
//     delete req.session.sessionFlash;
//     next();
// })

// const nexmo = new Nexmo({
//     apiKey: process.env.API_KEY,
//     apiSecret: process.env.API_SECRET,
// })

/////////////////////////WORKING OTP CODE///////////////////////////////////////////////////////////////////

// router.get("/phone", (req, res) => {      //rendering the phone page for otp
//     res.render('phone', {message: "hello world"})
// })

// router.post('/phone', (req, res) => {          //WORKING: Entering phone no and checking if it is valid or not
//     nexmo.verify.request({
//         number: req.body.number,
//         brand: 'ACME Corp'
//     }, (error, result) => {
//         if(result.status != 0){
//             res.render('phone', { message: result.error_text})
//         } else{
//             res.render('check', { requestId: result.request_id })
//         }
//     })
// })

// router.post('/check', (req, res) => {        //WORKING: CHECKING THE OTP CODE
//     nexmo.verify.check({
//         request_id: req.body.requestId,
//         code: req.body.code,
//     }, (error, result) => {
//         if(result.status != 0){
//             res.render('phone', { message: result.error_text})
//         } else{
//             res.render('login')
//         }
//     })
// })

/////////////////////////////////////ENDING OTP CODE/////////////////////////////////////////////////////////

router.get("/", [ensureGuest], (req, res) => {  //rendering the USERHOME page, middleware ensureGuest which logs in ONLY new user
    res.render("index", {message: req.flash('message'),});
});

router.get("/createMaster", ensureAuth, (req, res) => {  
    res.render("createMaster", {
        message: req.flash('message'),    //signed in successfully
        message1: req.flash('message1'),  //invalid Codename
    });
});

router.post("/createMaster", async (req, res) => {  
   try{
    const {codeName, password} = req.body;
    const userLog = await masterPass.findOne({ codeName: codeName })
    //const isMatch = await bcrypt.compare(password, userLog.password)    
    const firstName = req.user.firstName;
   
   const regUser = new masterPass({
        codeName: codeName,
        password: password,
    })

    //////////////////////////////////////////////////////////////

    const token = await regUser.generateAuthToken();  //jwtToken
    console.log('The token part is ' + token);
    res.cookie("jwt", token, {          //in built in nodejs
        expires: new Date(Date.now() + 1800000),
        httpOnly: true,     //we can delete this manually, javascript cant delete it on its own
    });   
    
    
    /////////////////////////////////////////////////////////////
    
    
    if(codeName === firstName){
        await regUser.save();
        req.flash('message', "Created account successfully")
        res.redirect('/homeUser');
        console.log(`done ${req.user.firstName}!!`)
    }
    else{
        req.flash('message1', "Invalid CodeName");
        res.redirect('/createMaster');
        console.log('Invalid CodeName');
    }
       
    //}else{
      //  res.send("PASSWORDS NOT MATCHING");
    //}
    
   }catch(err){
       console.log(err);
   }
});

router.get("/loginMaster", ensureAuth, (req, res) => {  
    res.render("loginMaster", {
        message: req.flash('message'),
        message1: req.flash('message1'),
    });
});

router.post("/loginMaster", async (req, res) => {  
    try{
        const {codeName, password} = req.body;

        const userLog = await masterPass.findOne({ codeName: codeName })
        const isMatch = await bcrypt.compare(password, userLog.password)
        const firstName = req.user.firstName;

        ////////////////////////////////////////////////////////////
        
        const token = await userLog.generateAuthToken();  //jwtToken
        console.log("The token is " + token);

       
        
        ///////////////////////////////////////////////////////

        if((codeName === firstName) && isMatch){

            res.cookie("jwt", token, {          //in built in nodejs
                expires: new Date(Date.now() + 1800000),
                httpOnly: true,     //we can delete this manually, javascript cant delete it on its own
            }); 


            req.flash('message', "Logged In Successfully")
            res.redirect('/homeUser')    

          console.log(`LOGGED IN ${req.user.firstName}!!!!`)
        } else{
            console.log('sorry, not logged in');
        }
        // else {
        //     req.flash('message1', "Invalid Credentials")
        //     res.redirect('/loginMaster')    
        //     }
        if((codeName === userLog.codeName) || !isMatch){
            req.flash('message1', "Invalid Credentials, Please type in your CodeName or Password correctly")
            res.redirect('/loginMaster')   
        }
    } catch(err){
        req.flash('message1', "Invalid Credentials, User does not exist.")
        res.redirect('/loginMaster')   
        //console.log(err);
    }
 });


router.get("/homeUser", [authCookie, ensureAuth] , (req, res) => {   //rendering the HOMEUser page, middleware ensureAuth in place to check if the logged in user is visiting this page or not
    res.render("homeUser", {
        name: req.user.firstName,
        message: req.flash('message'),
    });
});

router.get("/terms", (req, res) => {   
    res.render("terms");
});

router.get("/about", (req, res) => {   
    res.render("about");
});



router.get("/cPass", [authCookie, ensureAuth], (req, res) => {     //rendering the CreatePassword page, middleware ensureAuth in place to check if the logged in user is visiting this page or not
    res.render("cPass");
});

router.post("/cPass", async (req, res) => {    
    let postCred;
         postCred = new createPass({             
            title: req.body.title,                
            body: req.body.body,
            //encryptBody: req.encryptBody,
            user: req.user.id,
         })
      
         //saveCover(postCred, req.body.img);     
       
         try {
            await postCred.save();
            req.flash('message', "Saved Successfully")
            res.redirect('/myPass');
         } catch(e){
             console.log(e);
         }
     });

// router.get("/normalPass", ensureAuth, (req, res) => {     //rendering the CreatePassword page, middleware ensureAuth in place to check if the logged in user is visiting this page or not
//     res.render("normalPass");
// });

// router.post("/normalPass", async (req, res) => {    
//     let postCredD;
//          postCredD = new createWithout({             
//             title: req.body.title,                
//             body: req.body.body,
//             user: req.user.id,
//          })
//         try {
//             await postCredD.save();
//             res.redirect('/myPass');
//          } catch(e){
//              console.log(e);
//          }
//      });


// router.post("/cPass", async (req, res) => {    
// //     const hide = await createPass.findById(req.user.id).select('-body');
// //    console.log(hide);
// let postCred;
//     postCred = new createPass({             
//        title: req.body.title,                
//        encryptBody: req.encryptBody,
//        //encryptBody: req.body.encryptBody,                    
//        user: req.user.id,
//    })
//    try{
//     await postCred.save();
//    res.redirect('/myPass');
//    } catch(e){
//        console.log(e);
//    }
// });

/////***************////////ORIGINAL WORKING CODE////////////****************////////////////////////////////


    
///////////////////**********************************///////////////////////////////////////////////  
    



// try{
//     req.body.user = req.user.id;
//     //createPass.populate('displayName')
//     await createPass.create(req.body);
//     res.redirect("/myPass");
// }
// catch(err){
//     console.log(err);
// },

//createPass.findOne({title: req.body.title, body:req.body.body})


router.get("/myPass", [authCookie, ensureAuth], async (req, res) => {    //rendering the myPasswords page, middleware ensureAuth in place to check if the logged in user is visiting this page or not
    
    const userId  = await createPass.findById(req.params.id);

    if (req.query.search) {       //SEARCH BAR
        const regex = new RegExp(escapeRegex(req.query.search), 'i');
        const cred = await createPass.find({title: regex})
        .lean()
        res.render("myPass", { 
            cred:cred, 
            message: req.flash('message'),
            })
    }  //Implemented search

    try {
        const cred = await createPass.find({user: req.user.id})
        .lean()    //finding the userId and accordingly rendering the stored info
        .sort({createdAt: 'desc'})
        
        // const cWithout = await createWithout.find({user: req.user.id})
        // .lean()    //finding the userId and accordingly rendering the stored info
        // .sort({createdAt: 'desc'})
        
        res.render("myPass", { 
            cred:cred, 
            message: req.flash('message'),
        })
    }
    catch(err) {
        console.log(err);
        res.send("Nothing here...");
    }
});

//const moment = require('moment');

// router.get("/myProfile", ensureAuth, async (req, res) => {     //rendering the myProfile page, and also securing with middleware
//     //const pid = await createPass.findById(req.params.id);
//     res.render("myProfile", {
//         name: req.user.firstName,
//         lastName: req.user.lastName,
//         email: req.user.email,
        
//     });
// });

router.get("/login", ensureGuest, (req, res) => {     //rendering the LOGIN page, middleware ensureGuest which logs in ONLY new user
    req.flash('message', "Signed In Successfully")
    res.render("login");  //  //login
});

router.get('/logout', async (req, res) => {  //authCookie middleware to be put  //rendering LOGOUT and redirecting to LOGIN page
    
    /////////////////////////////////////////////////
    try {
        // req.user.tokens = req.user.tokens.filter((currElem) => {
        //     return currElem.token !== req.token  //for clearing token from database too
        // })

        res.clearCookie("jwt");
        console.log("Logout Successfully!")

    //////////////////////////////////////////////////////

        req.logout();

       // await req.user.save();

        req.flash('message', "Logged Out Successfully")
        res.redirect("/");
    } catch (error) {
        res.status(500).send(error);
    }
});

// router.get('/editPage', (req, res) => {
//     res.redirect('/myPass');
// })

// router.get('/editPage/edit/:id', async (req, res) => {
//     try {
//         // const postCred = new createPass({
//         //     title: req.body.title,
//         //     body: req.body.body,
//         //     user: req.body.user,
//         // })
//         // postCred.user = req.user.id;
//         const id = req.params.id;
//         const getPass = createPass.findById({_id: id});
//         const cred = await createPass.find({ user: req.user.id })
//         .lean()    //finding the userId and accordingly rendering the stored info
//         .sort({createdAt: 'desc'})
//         res.render("/editPass",     { cred })
//     }
//     catch(err) {
//         console.log(err);
//         res.send("Nothing here...");
//     }
// })


// router.delete('/:id', ensureAuth, async (req, res) => {
//     try {
//       let info = await Story.createPass(req.params.id).lean()
  
//       if (!info) {
//         console.log("nothing")
//       }
  
//       if (info.user != req.user.id) {
//         res.redirect('/myPass')
//       } else {
//         await createPass.remove({ _id: req.params.id })
//         res.redirect('/myPass')
//       }
//     } catch (err) {
//       console.error(err)
      
//     }
//   })

///////////////////////////////////////////////////////////////////

// router.get('/:id/myPass', async (req, res) => {
//     const idd = createPass.findById(req.params.id)
//     res.redirect('/myPass');
// })

////////////////////////////////// VIEW  /////////////////////////////////////////

router.get('/:id/viewPass', [authCookie, ensureAuth], async (req, res) => {    //VIEW PASSWORDS WITH IMAGE
    try{
    const passView = await createPass.findById(req.params.id);

    res.render('viewPass', {
        passView: passView,
    });
    }catch(err){
        console.log(err);
    }
})

// router.get('/:id/viewPassWithout', ensureAuth, async (req, res) => {    //VIEW PASSWORDS WITHOUT IMAGE
//     try{
//     const passViewWithout = await createWithout.findById(req.params.id);

//     res.render('viewPassWithout', {
//         passViewWithout: passViewWithout,
//     });
//     }catch(err){
//         console.log(err);
//     }
// })

/////////////  VIEW ////////////////////////////////////////////////////////////




///////////// EDIT ////////////////////////////////////////////////////

router.get('/:id/edit', [authCookie, ensureAuth], async (req, res) => {    //EDITED WITH IMAGE
    try{
    const passEdit = await createPass.findById(req.params.id);

    res.render('edit', { 
        passEdit: passEdit,
    })
    }catch(err){
        console.log(err);
    }
})

// router.get('/:id/editPassWithout', ensureAuth, async (req, res) => {    //EDITED WITHOUT IMAGE
//     try{
//     const passEditWithout = await createWithout.findById(req.params.id);

//     res.render('editPassWithout', { 
//         passEditWithout: passEditWithout,
//     })
//     }catch(err){
//         console.log(err);
//     }
// })

router.put('/:id', ensureAuth, async (req, res) => {     //UPDATING WITH IMAGE
    // let editImg = await createPass.findById(req.params.id).lean();

    
    // if( editImg.user != req.user.id){
    //     res.redirect('/homeUser');
    // } else { 
    //    editImg = await createPass.findOneAndUpdate({ _id: req.params.id}, req.body, {
    //         new: true,
    //         runValidators: true,
    //     })
    //     res.redirect('/myPass');
    // }

    let editPass;

    try {
        
        editPass = await createPass.findById(req.params.id)
        //editP = await createWithout.findById(req.params.id).lean();

        editPass.title = req.body.title;
        editPass.body = req.body.body;
        await editPass.save()
        req.flash('message', "Updated Successfully")
        res.redirect('/myPass');
        }
    catch(err){
        console.log(err);
    }
})

// router.put('/:id', ensureAuth, async (req, res) => {     //WITHOUT IMAGE
//     //let editP;

//     let editP = await createWithout.findById(req.params.id).lean();

    
//     if( editP.user != req.user.id){
//         res.redirect('/homeUser');
//     } else { 
//        editP = await createWithout.findOneAndUpdate({ _id: req.params.id}, req.body, {
//             new: true,
//             runValidators: true,
//         })
//         res.redirect('/myPass');
//     }

//     // try {
//     //     editP = await createWithout.findById(req.params.id)
//     //     editP.title = req.body.title;
//     //     editP.body = req.body.body;
//     //     await editP.save()
//     // res.redirect('/myPass');
//     // }
    
//     // catch(err){
//     //     console.log(err);
//     // }
    
// })

///////////////////////////// EDIT /////////////////////////////////////////////////////////////////



router.delete('/:id', ensureAuth, async (req, res) => {    //FINALLY DELETED!!!!
    try{
    await createPass.findByIdAndDelete(req.params.id);
    //await createWithout.findByIdAndDelete(req.params.id);

    req.flash('message', "Deleted successfully")
    res.redirect('/myPass');
    }catch(err){
        console.log(err); 
    } 
})
  

////////////////////////////////////////////////////////////////////////////


// router.get('/:id/edit', async (req, res) => {    //EDITED!!!!
//     try{
//         const passId = await createPass.findById(req.params.id);
//         res.render('edit', { passId : passId})
//     } catch(err){
//         console.log(err);
//     }
// })

// router.put('/:id', async (req, res) => {     //finally UPDATED!!!
//     let passId;
//     try{
//     passId = await createPass.findById(req.params.id);
//     passId.title = req.body.title;
//     passId.body = req.body.body;
//     await passId.save();
//     res.redirect('/myPass');
//     } catch{
//         if(passId == null){
//             res.redirect('/homeUser');
//         }
//     }
// })

escapeRegex = (text) => {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};



// function saveCover(createPass, imgEncoded) {       //FINALLYYYYYYYYYYYYYY!!
//     if(imgEncoded == null) return
       

//     const img = JSON.parse(imgEncoded);
//     //console.log( "JSON parse: "+ img);
//     if(img != null && imageMimeTypes.includes(img.type)){     //   if(img != null && imageMimeTypes.includes(img.type)){
//         createPass.img = new Buffer.from(img.data, 'base64')
//         createPass.imgType = img.type;
//     }
// }


module.exports = router;


// if(imgEncoded != null) {                  //if(imgEncoded == null) return
//     const img = JSON.parse(imgEncoded);
//     //console.log( "JSON parse: "+ img);
//     if(imageMimeTypes.includes(img.type)){     //   if(img != null && imageMimeTypes.includes(img.type)){
//         createPass.img = new Buffer.from(img.data, 'base64')
//         createPass.imgType = img.type;
//     }
// }
//     else{
//         console.log("Errrrrrrrrrr: " + err)
//     }