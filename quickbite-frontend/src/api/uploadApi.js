import axiosClient from "./axiosClient";

export const uploadImageApi = async (file, folder = "quickbite") => {
  const formData = new FormData();

  formData.append("image", file);
  formData.append("folder", folder);

  const response = await axiosClient.post("/upload/image", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

export const deleteImageApi = async (publicId) => {
  const response = await axiosClient.delete("/upload/image", {
    data: {
      publicId,
    },
  });

  return response.data;
};
