const jwt = require('jsonwebtoken')
const master = require('../models/master')

module.exports = {
    ensureAuth: (req, res, next) => {
        if(req.isAuthenticated()){
            return next();
        }
        else{
            res.redirect("/");    //redirect("/")
        }
    },
    ensureGuest: (req, res, next) => {
        if(req.isAuthenticated()){
            res.redirect("/homeUser");  //homeUser
        }
        else{
            return next();
        }
    },
    
    authCookie: async (req, res, next) => {
        try {
            const token = req.cookies.jwt;
            const verifyUser = jwt.verify(token, process.env.AUTH_JS_KEY)
            console.log(verifyUser)
            const user = await master.findOne({_id: verifyUser._id})
            
            // req.token = token;
            // req.user = user;

            next()
        } catch (error) {
            console.log('Provide JWT PLEASE' + error);
            res.redirect('/loginMaster');
        }
    },

}