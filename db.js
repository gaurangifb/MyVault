const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
                  
            useUnifiedTopology: true,
            useNewUrlParser: true,
            useCreateIndex: true,
            useFindAndModify: false,
            }); 

        console.log(`MongoDB connected: ${conn.connection.host}`)
    }
    catch(err){
        console.error(err);
        process.exit(1);
    }
}

module.exports = connectDB;