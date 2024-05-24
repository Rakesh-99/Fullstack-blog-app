import userModel from "../model/userModel.js";
import asyncHandler from 'express-async-handler';
import errorHandler from "../utils/errorHandler.js";
import bcrypt from 'bcryptjs';
import JWT from 'jsonwebtoken';





// GET REQ  : Fetching User :
export const getUser = async (req, res, next) => {
    const user = await userModel.find({});

    if (user.length === 0) {
        return next(errorHandler('No user found!', 400));
    }

    return res.status(200).json({
        success: true,
        message: 'User has been fetched',
        user: user

    })

};



// POST REQ : Registering User :
export const registerUser = asyncHandler(async (req, res, next) => {

    const { username, email, password } = req.body;

    const userExist = await userModel.findOne({ email: email });

    const genSalt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, genSalt);

    if (userExist) {

        return next(errorHandler('User is already exist!', 400))
    } else {

        const registerUserInfo = await new userModel({
            username,
            email,
            password: hashedPassword
        });
        try {
            await registerUserInfo.save();
            const { password, ...rest } = registerUserInfo._doc;
            return res.status(200).json({
                success: true,
                message: 'User has been registered successfully',
                user: rest
            });
        } catch (error) {
            console.log(error);
            return next(errorHandler('An unexpected error occurred while registering user!', 400))
        }
    }
});


// POST REQ : Login User :

export const loginUser = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;
    const existUser = await userModel.findOne({ email: email });

    if (!existUser) {
        return next(errorHandler('User not found', 401));
    }

    const matchPassword = await bcrypt.compare(password, existUser.password);

    if (!matchPassword) {
        return next(errorHandler('Invalid password', 401));
    }

    const createToken = JWT.sign({ id: existUser.id }, process.env.JWT_TOKEN, { expiresIn: '30d' });
    const updateUser = await userModel.findByIdAndUpdate({ _id: existUser.id }, { token: createToken }, { new: true });

    if (updateUser) {
        const { password, ...rest } = updateUser._doc;
        return res.status(200).cookie('accessToken', updateUser.token, { httpOnly: true, secure: true }).json({
            status: 200,
            success: true,
            message: 'Login successful',
            user: rest
        })
    }
});


// PUT REQ : Update User : 

export const updateUser = asyncHandler(async (req, res, next) => {

    const paramsId = req.params.id;
    const userId = req.user.id;

    if (paramsId !== userId) {
        return next(errorHandler('Resources can not be accessed,Unauthorized user!', 401));

    } else {

        let userInfo = {
            username: req.body.username,
            email: req.body.email,
            profilePicture: req.body.profilePicture
        }

        try {

            if (req.body.password) {
                let genSalt = await bcrypt.genSalt(10);
                let hashedPassword = await bcrypt.hash(req.body.password, genSalt);
                userInfo.password = hashedPassword;
            }

            const updateUserInfo = await userModel.findByIdAndUpdate(paramsId, {
                $set: userInfo

            }, { new: true })

            const { password, ...rest } = updateUserInfo._doc;

            return res.status(200).json({
                message: 'User has been updated',
                success: true,
                user: rest
            })

        } catch (error) {
            return next('An unexpected error occurred while updating data', 500);
        }
    }
});




// POST req for Google firebase login : 

export const googleOAuth = asyncHandler(async (req, res, next) => {

    const { username, email, profilePicture } = req.body;

    const user = await userModel.findOne({ email: email });

    if (user) {
        const createToken = JWT.sign({ id: user._id }, process.env.JWT_TOKEN, { expiresIn: '30d' });
        return res.status(200).cookie('accessToken', createToken, { httpOnly: true }).json({
            success: true,
            message: 'User has been successfully loggedIn',
            user: user
        })
    } else {
        const generatePassword = 100 * Math.random().toString().replace('.', '') + process.env.JWT_TOKEN.slice(20);

        try {
            const genSalt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(generatePassword, genSalt);
            const modifiedName = username.toLowerCase().replace(/\s/g, '');


            const loginGoogleUser = new userModel({

                username: modifiedName,
                email: email,
                profilePicture: profilePicture,
                password: hashedPassword
            })
            await loginGoogleUser.save();


            const createToken = JWT.sign({ id: loginGoogleUser._id }, process.env.JWT_TOKEN);

            const updateUser = await userModel.findByIdAndUpdate({ _id: loginGoogleUser._id }, { token: createToken }, { new: true });


            const { password, ...rest } = updateUser._doc;

            return res.status(200).cookie('accessToken', createToken, { httpOnly: true }).json({
                success: true,
                message: 'User has been loggedIn',
                user: rest
            })
        } catch (error) {

            console.log(error);
            return next(errorHandler(error));
        }
    }
})





// DELETE Api for deleting user : 

export const deleteUser = asyncHandler(async (req, res, next) => {
    const userId = req.user.id;
    const { id } = req.params;

    if (userId !== id) {
        return next(errorHandler('Unauthorized user!', 401));
    } else {
        await userModel.findByIdAndDelete({ _id: id });

        return res.status(200).json({
            success: true,
            message: 'User has been deleted'
        })
    }
});



// POST req for user SignOut : 

export const signOutUser = asyncHandler(async (req, res, next) => {
    try {
        res.clearCookie('accessToken').json({
            success: true,
            message: 'User has been signedOut'
        })
    } catch (error) {
        return next(errorHandler(error));
    }
})