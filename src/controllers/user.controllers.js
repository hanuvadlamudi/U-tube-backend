import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async (userid) => {
  try {
    const user = await User.findById(userid);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Tokens generation failed");
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, userName, password } = req.body;

  if (
    [fullName, email, userName, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ userName }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "user Already Existed");
  }

  // console.log(req);
  // console.log(req.files);

  const avatarLocalPath = req.files?.avatar[0]?.path;

  // console.log(req.files?.avatar[0])
  // console.log(req.files.avatar)

  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    userName: userName.toLowerCase(),
  });

  const createdUser = await User.find(user._id).select(
    "-password  -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "user not created");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registration Successful"));
});


//login
const loginUser = asyncHandler(async (req, res) => {
  const { email, userName, password } = req.body;
  console.log(email);

  if (!userName && !email) {
    throw new ApiError(400, "username or email is required");
  }

  const user = await User.findOne({
    $or: [{ userName }, { email }],
  });

  console.log("user after db call : ", user);

  if (!user) {
    throw new ApiError(404, "user does not exist");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "enter Correct Password");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password  -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "login successful"
      )
      //again we are sending tokens because may be user is for Application Storage
    );
});



//logout
const logoutUser = asyncHandler(async (req, res) => {

  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { refreshToken: undefined },
    },
    {
      new: true, // returned value will be updated value;
    }
  );

  const options = {
    httpOnly : true,
    secure : true
  }

  return res
  .status(200)
  .clearCookie("accessToken", options)
  .clearCookie("refreshToken",options)
  .json( new ApiResponse(200,{},"user Logged out"));
});


const refreshAccessToken = asyncHandler( async (req,res) => {

  const incomingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken

  if(!incomingRefreshToken){
    throw new ApiError(401,"wrong refresh Token");
  }

  try {

    const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)

    const user = await User.findById(decodedToken?._id);

    if(!user){
      throw new ApiError(401,"Invalid Refresh Token");
    }

    if(incomingRefreshToken !== user?.refreshToken){
      throw new ApiError(401,"Refresh Token is expired or used");
    }

    const {accessToken,newRefreshToken} = await generateAccessAndRefreshToken(user._id);

    const options = {
      httpOnly : true,
      secure : true
    }

    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",newRefreshToken,options)
    .json(
      new ApiResponse(200,{accessToken,refreshToken:newRefreshToken},"New Access Token")
    )
    
  } catch (error) {
    throw new ApiError(401,error?.message || "Invalid refresh Token")
  }

})

const changePassword = asyncHandler( async(req,res) => {
  const {oldPassword , newPassword} = req.body;

  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if(!isPasswordCorrect){
    throw new Error(400,"password is wrong");
  }

  user.password = newPassword;
  await user.save({validateBeforeSave : false});

  res
  .status(200)
  .json(new ApiResponse(200,{},"password is updated"))
})


const getCurrentUser = asyncHandler( async(req,res) => {
  return res
  .status(200)
  .json(new ApiResponse(200,req.user,"details of Current User"))
})

const updateAccountDetails = asyncHandler( async(req,res) => {

  const {userName,email} = req.body;

  if(!(userName && email)){
    throw new ApiError(400,"All fields are requireed");
  }

  const user = await User.findByIdAndUpdate(req.user?._id,{
    $set : {
      userName,
      email
    },
  },
  {new:true}).select("-password  -refreshToken")

  return res
  .status(200)
  .json( new ApiResponse(200,user,"Details updated Successfully"))
})


const updateAvatar = asyncHandler(async (req,res) => {
  const avatarLocalPath = req.file?.path

  if(!avatarLocalPath){
    throw new ApiError(400,"Avatar file is missing")
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if(!avatar.url){
    throw new ApiError(400,"Error in file uploading in cloudinary");
  }

  const user = await User.findByIdAndUpdate(req.user?._id,{
    $set : {
      avatar : avatar.url
    }
  },
  {new : true}.select("-password  -resfreshToken"))

  return res
  .status(200)
  .json(200,user,"Avatar image updated Successfully");
})



export { 
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changePassword,
  getCurrentUser,
  updateAccountDetails,
  updateAvatar
};
