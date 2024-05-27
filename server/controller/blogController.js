import errorHandler from "../utils/errorHandler.js";
import asyncHandler from 'express-async-handler';
import blogModel from "../model/blogModel.js";






// Get all blogs : 

export const getAllBlogs = asyncHandler(async (req, res, next) => {

    const page = parseInt(req.query.page) || 1;
    const limitBlogs = parseInt(req.query.limit) || 6;
    const sortBlog = req.query.sort === 'asc' ? 1 : -1;
    const skipBlogs = (page - 1) * limitBlogs

    const filterBlogs = {
        ...(req.query.userId && { userId: req.query.userId }),
        ...(req.query.slug && { slug: req.query.slug }),
        ...(req.query.blogId && { _id: req.query.blogId }),
        ...(req.query.searchBlog && {

            $or: [
                { blogTitle: { $regex: req.query.searchBlog, $options: 'i' } },
                { blogBody: { $regex: req.query.searchBlog, $options: 'i' } }
            ]
        })
    }


    try {
        const blogs = await blogModel.find(filterBlogs).skip(skipBlogs).sort({ updatedAt: sortBlog }).limit(limitBlogs)


        const countBlogs = await blogModel.countDocuments(filterBlogs);

        const currentDate = new Date();
        const previousMonth = new Date(currentDate);
        previousMonth.setMonth(currentDate.getMonth() - 1);

        return res.status(200).json({
            success: true,
            message: 'Blogs have been fetched',
            previousMonth,
            countBlogs,
            blogs: blogs
        })
    } catch (error) {
        return next(errorHandler(error.message), 400);
    }
});




// Post Blog : POST API - 

export const postBlog = asyncHandler(async (req, res, next) => {

    const { blogTitle, blogCategory, blogImgFile, blogBody, user } = req.body


    if (!user.isAdmin) {
        return next(errorHandler('You can not create blog,Unauthorized user!', 401));
    }

    const slug = req.body.blogTitle.trim().toLowerCase().replace(/\s+/g, '-')

    const addBlogPost = new blogModel({
        blogTitle: blogTitle,
        blogCategory: blogCategory,
        blogImgFile: blogImgFile,
        blogBody: blogBody,
        userId: user._id,
        slug: slug
    })
    try {
        await addBlogPost.save();
        return res.status(200).json({
            success: true,
            message: 'Blog has been created',
            slug: slug,
            blog: addBlogPost
        })
    } catch (error) {
        next(errorHandler(error));
    }
})