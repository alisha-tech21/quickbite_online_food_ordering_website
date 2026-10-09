import axiosClient from "./axiosClient";

// Specific restaurant ke reviews ke liye
export const getReviewsByRestaurant = async (restaurantId) => {
  try {
    const response = await axiosClient.get(
      `/restaurants/${restaurantId}/reviews`,
    );
    return response.data;
  } catch (error) {
    console.error(
      `Error fetching reviews for restaurant ${restaurantId}:`,
      error,
    );
    return { success: false, reviews: [], error: error.message };
  }
};

// Home page ke liye sabhi reviews fetch karne ke liye (Yahan `/restaurants/reviews` hona chahiye)
export const getAllReviews = async () => {
  try {
    const response = await axiosClient.get(`/restaurants/reviews`); // <-- Yahan `/restaurants/reviews` check karein
    return response.data;
  } catch (error) {
    console.error("Error fetching all reviews:", error);
    return { success: false, reviews: [], error: error.message };
  }
};
