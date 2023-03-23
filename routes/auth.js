const router = require('express').Router();
const passport = require('passport');

router.get("/google", 
        passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get("/google/callback", passport.authenticate('google', {
    failureRedirect: "/login" }),
    (req, res) => {
        res.redirect('/loginMaster');  //homeUser
    }
);

module.exports = router;