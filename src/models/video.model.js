import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const VideoSchema = mongoose.Schema({
    video:{
        type : String,
        required:true
    },
    thumbnail:{
        type:String,
        required:true
    },
    title:{
        type:String,
        required : true,
    },
    description :{
        type:String,
        required:true
    },
    duration : {
        type: Number,  // from cloudinary
        required : true 
    },
    views:{
        type : Number,
        default : 0
    },
    isPublished:{
        type:Boolean,
        required : true
    },
    owner : {
        type: mongoose.Schema.Types.ObjectId,
        ref : "User"
    }

},{
    timestamps : true
}
)

VideoSchema.plugin(mongooseAggregatePaginate);

export const Video = mongoose.model("Video",VideoSchema);