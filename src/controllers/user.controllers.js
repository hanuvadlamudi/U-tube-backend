import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError}  from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler ( async (req,res) => {
    
    const {fullName,email,userName,password} = req.body;
    
    if([fullName,email,userName,password].some((field) => field?.trim() === "")){
        throw new ApiError(400,"All fields are required");
    }

    const existedUser = await User.findOne({
        $or :[{userName},{email}]
    })

    if(existedUser){
        throw new ApiError(409,"user Already Existed")  
    }

    // console.log(req);
    // console.log(req.files);

    const avatarLocalPath = req.files?.avatar[0]?.path;

    // console.log(req.files?.avatar[0])
    // console.log(req.files.avatar)

    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar is required"); 
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar){
        throw new ApiError(400,"Avatar file is required");
    }

    const user = await User.create({
        fullName,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        email,
        password,
        userName:userName.toLowerCase()
    })

    const createdUser = await User.find(user._id).select("-password  -refreshToken")

    if(!createdUser){
        throw new ApiError(500,"user not created")
    }

    return res.status(201).json(
        new ApiResponse(200,createdUser,"User registration Successful")
    )

})

export {
    registerUser  
} 

