import { Schema, model } from "mongoose";
import { createHmac, randomBytes } from "node:crypto";
import {
    createTokenForUser,
} from "../services/authentication.js";

const userSchema = new Schema({
    fullName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    salt: {
        type: String,

    },

    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['USER', 'ADAMIN'],
        default: 'USER',
    },
    profileImageURL: {
        type: String,
        default: "/Images/defaultImage.png",
    }
}, { timestamps: true });

userSchema.pre("save", function (next) {
    const user = this;
    if (!user.isModified("password")) return;
    const salt = randomBytes(16).toString();
    const hashedPass = createHmac("sha256", salt)
        .update(user.password)
        .digest("hex");

    this.salt = salt;
    this.password = hashedPass;

    next();
})
userSchema.static(
    "matchPassAndGenToken",
    async function (email, password) {
        const user = await this.findOne({ email });
        if (!user) throw new Error("User not found!");

        const salt = user.salt;
        const hashedPassword = user.password;

        const userProvidedHash = createHmac("sha256", salt)
            .update(password)
            .digest("hex");

        if (hashedPassword !== userProvidedHash)
            throw new Error("Incorrect Password");

        const token = createTokenForUser(user);
        return token;
    }
);
const User = model('user', userSchema);
export default User; 