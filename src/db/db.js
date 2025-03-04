import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";


const connectDB = async () =>{

    try{
        const connection = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
        console.log("Mongo DB connection successful")
    }catch(error){
        console.error("Mongo DB connection failed");
        process.exit(1);
    }
}


export default connectDB;