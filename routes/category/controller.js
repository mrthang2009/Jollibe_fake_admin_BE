const { Category, Media } = require("../../models");
const { fuzzySearch, generateUniqueFileName } = require("../../utils");

const multer = require("multer");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const storage = multer.memoryStorage();
const upload = multer({
  storage,
});

module.exports = {
  createCategory2: async (req, res, next) => {
    const { name, description } = req.body;
    try {
      const media = await Media.findOne({ name: "LOGO" });
      const newCategory = new Category({
        name,
        description: description || null,
        imageId: media._id,
      });
      const savedCategory = await newCategory.save();
      return res.status(200).json({
        message: "Category created successfully",
        payload: savedCategory,
      });
    } catch (error) {
      console.log("««««« error »»»»»", error);
      return res.status(400).json({ message: "Adding category failed", error });
    }
  },

  getAllCategory: async (req, res, next) => {
    try {
      const payload = await Category.find({ isDeleted: false }).populate(
        "media"
      );
      const total = payload.length;
      return res.status(200).json({
        message: "Retrieve category data successfully",
        total,
        payload,
      });
    } catch (error) {
      console.log("««««« error »»»»»", error);
      return res
        .status(400)
        .json({ message: "Retrieving category data failed", error });
    }
  },

  getListCategory: async (req, res, next) => {
    try {
      const { page, pageSize } = req.query; // 10 - 1
      const limit = pageSize || 8;
      const skip = limit * (page - 1) || 0;
      let payload = await Category.find({ isDeleted: false })
        .populate("media")
        .skip(skip)
        .limit(limit);
      const totalCategory = await Category.countDocuments(payload);
      return res.status(200).json({
        message: "Retrieve category data successfully",
        totalCategory,
        count: payload.length,
        payload,
      });
    } catch (error) {
      return res
        .status(400)
        .json({ message: "Retrieving category data failed", error });
    }
  },

  getDetailCategory: async (req, res, next) => {
    try {
      const { id } = req.params;
      const payload = await Category.findOne({
        _id: id,
        isDeleted: false,
      }).populate("media"); // có thể bỏ
      if (!payload) {
        return res.status(400).json({ message: "No category found in data" });
      }
      return res.status(200).json({
        message: "Retrieve detailed category data successfully",
        payload,
      });
    } catch (error) {
      console.log("««««« error »»»»»", error);
      return res
        .status(400)
        .json({ message: "Retrieving detailed category data failed", error });
    }
  },

  updateCategory: async (req, res, next) => {
    try {
      const { id } = req.params;
      // const { name, description, isDeleted } = req.body;
      const payload = await Category.findOneAndUpdate(
        { _id: id, isDeleted: false },
        { ...req.body },
        { new: true }
      );
      if (!payload) {
        return res.status(400).json({ message: "No category found in data" });
      }
      return res
        .status(200)
        .json({ message: "Updated category data successfully", payload });
    } catch (error) {
      console.log("««««« error »»»»»", error);
      return res
        .status(400)
        .json({ message: "Updating category data failed", error });
    }
  },

  deleteCategory: async (req, res, next) => {
    try {
      const { id } = req.params;
      const payload = await Category.findOneAndUpdate(
        { _id: id, isDeleted: false },
        { isDeleted: true },
        { new: true }
      );
      if (!payload) {
        return res.status(400).json({ message: "No category found in data" });
      }
      return res
        .status(200)
        .json({ message: "Delete category data successfully" });
    } catch (error) {
      console.log("««««« error »»»»»", error);
      return res
        .status(400)
        .json({ message: "Delete category data failed", error });
    }
  },

  searchCategory: async (req, res, next) => {
    try {
      const { keyword } = req.query;

      const conditionFind = { isDeleted: false };

      const payload = await Category.find({
        ...conditionFind,
        name: { $regex: fuzzySearch(keyword) },
      })
        .sort({ name: 1 })
        .populate("media");

      const totalCategory = await Category.countDocuments(conditionFind);

      if (payload) {
        return res.status(200).json({
          message: "Search information of categories successfully",
          totalCategory,
          count: payload.length,
          payload,
        });
      }

      return res.status(410).json({
        message: "Search information of categories not found",
      });
    } catch (err) {
      console.log("««««« error »»»»»", err);
      return res.status(404).json({
        message: "Search information of categories failed",
        error: err,
      });
    }
  },
};
