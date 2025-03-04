import dotenv from 'dotenv';
dotenv.config();
import connectDB from "./db/db.js";
import app from "./app.js";
import { configureCloudinary } from './utils/cloudinary.js';


connectDB()
.then(() => {
    app.listen(process.env.PORT || 8080, () => {
        console.log(`app is listening on port: ${process.env.PORT}`)
    })
})
.catch((err) => {
    console.log("Mongo DB connection Failed", err)
})

configureCloudinary();