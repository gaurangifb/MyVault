const mongoose = require('mongoose');
// const encrypt = require('mongoose-encryption');
const NodeRSA = require('node-rsa');
// const bcrypt = require('bcryptjs');

const createSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    body: {
        type: String,
        required: true,
    },
    // encryptBody: {
    //     type: String,
    //     required: false,
    // },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    // img: {
    //     type: Buffer,
    //     required: false,

    // },
    // imgType: {
    //     type: String,
    //     required: false,
    // }
})

// createSchema.virtual('coverImagePath').get(function() {  //FINALLYYYYYYYYYYYYYYYY!!!!
//      if(this.img != null && this.imgType != null) {
//         return `data:${this.imgType};charset=utf-8;base64,${this.img.toString('base64')}`
//     }
// })



// createSchema.pre('save', async function(next){
//         try{
//             const key = new NodeRSA({ b:1024});
//             let secret = `${this.body}`;
//             const encryptedString = await key.encrypt(secret, 'base64');        //encrypted BODY
//             this.encryptBody = encryptedString;

//             const decryptedString = await key.decrypt(encryptedString, 'utf8')     //decrypted BODY
//             this.body = decryptedString;

//             this.body = undefined;

//      } catch(err){
//          next(err)
//          }
//      });

    //  createSchema.methods.toJSON = function() {
    //     const obj = this.toObject();
    //     delete obj.body;
    //     return obj;
    //    }


// const secret = 'fasdlkfjlkdasf';
// createSchema.plugin(encrypt, {secret: secret, encryptedFields: ['title', 'body']});


// createSchema.pre('save', async function(next){
//     try{
//         const salt = await bcrypt.genSalt(10)
//         const hashedPass = await brypt.hash(this.body, salt);
//         this.body = hashedPass;
//         next();
// } catch(err){
//     next(err)
//     }
// });

// createSchema.pre('save', async function(next){    //WORKING CODE just for hashing in database, not client side
//     console.log('hi from inside');
//     if(this.isModified('title')){
//         this.title = await bcrypt.hash(this.title, 12);
//         this.body = await bcrypt.hash(this.body, 12);
//     }
//     next();
//  });

module.exports = mongoose.model('createPass', createSchema);

