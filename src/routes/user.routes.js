import { Router } from "express";
import {registerUser} from "../controllers/user.controllers.js";
import {upload} from "../middleware/multer.middleware.js";
import { loginUser } from "../controllers/user.controllers.js";
import { logoutUser } from "../controllers/user.controllers.js";
import { verifyjwt } from "../middleware/auth.middleware.js";
import { refreshAccessToken } from "../controllers/user.controllers.js";

const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        }, 
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
)

router.route("/login").post(loginUser)

//secure routes
router.route("/logout").post(verifyjwt,logoutUser);
router.route("/refresh-token").post(refreshAccessToken);

export default router;                      