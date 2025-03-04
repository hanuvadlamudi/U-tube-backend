import {v2 as cloudinary} from "cloudinary"
import fs from "fs"

// Don't configure immediately - create a function for it
const configureCloudinary = () => {
  
  cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
  });

  console.log("Cloudinary credentials in cloudinary.js file:", {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET ? "Secret exists" : "Secret missing"
  });
}

const uploadOnCloudinary = async (localFilePath) => {
    try {
        // Configure Cloudinary right before using it
        
        console.log("Attempting to upload file:", localFilePath);
        if (!localFilePath) {
            console.log("No local file path provided");
            return null;
        }
        
        console.log("Uploading to cloudinary...");
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        });
        
        console.log("Upload successful:", response.url);

        fs.unlinkSync(localFilePath);
        return response;
    } catch (error) {
        console.error("Cloudinary upload failed:", error);
        if (localFilePath) {
            fs.unlinkSync(localFilePath);
        }
        return null;
    }
}

export {uploadOnCloudinary,configureCloudinary}