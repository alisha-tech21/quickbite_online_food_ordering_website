const asyncHandler = require("express-async-handler");
const cloudinary = require("../config/cloudinary");

const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("Please select an image");
  }

  const folder = req.body.folder || "quickbite";

  const result = await new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        transformation: [
          {
            quality: "auto",
            fetch_format: "auto",
          },
        ],
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      },
    );

    uploadStream.end(req.file.buffer);
  });

  res.status(201).json({
    success: true,
    imageUrl: result.secure_url,
    publicId: result.public_id,
  });
});

const deleteImage = asyncHandler(async (req, res) => {
  const { publicId } = req.body;

  if (!publicId) {
    res.status(400);
    throw new Error("publicId is required");
  }

  await cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
  });

  res.json({
    success: true,
    message: "Image deleted successfully",
  });
});

module.exports = {
  uploadImage,
  deleteImage,
};
