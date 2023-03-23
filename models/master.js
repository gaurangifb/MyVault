const mongoose = require('mongoose');
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const master = new mongoose.Schema({
    codeName: {
        type: String,
        required: true,
    },
    
    password: {
        type: String,
        required: true,
    },
    tokens: [{
        token: {
            type: String,
            required: true,
        }   
    }]
})

// master.statics.nameExists = async function(codeName) {
//     try {
//         const user = await this.findOne({codeName})
//         if(user) return false

//         return true 
//     } catch (error) {
//         res.status(401).send(error);
//         console.log("errrr part: " + error)
//         return false
//     }
   
// }

master.methods.generateAuthToken = async function(){
    try {
        const token = await jwt.sign({_id: this._id}, process.env.MASTER_JS_KEY);
        this.tokens = this.tokens.concat({token: token})   //token(which is stored in database): token(above variable token)
        
        await this.save();
        return token
    } catch (error) {
        //res.send("the error part: " + error);
        console.log("the error part: " + error);
    }
}

master.pre('save', async function(next){
    if(this.isModified('password')){
        this.password = await bcrypt.hash(this.password, 10);
       //this.confirmPassword = undefined;
    }
   
    next();
})




module.exports = mongoose.model('master', master);

