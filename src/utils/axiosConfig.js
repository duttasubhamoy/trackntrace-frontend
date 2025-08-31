
import axios from "axios";
import BACKEND_URL from "./env";

// Create an instance of Axios with default settings
const axiosInstance = axios.create({
  baseURL: BACKEND_URL, // Use environment variable for backend API base URL
  timeout: 10000, // Optional: Set a timeout for requests
  headers: {
    "Content-Type": "application/json", // Default content type for requests
  },
});

// Request interceptor to add JWT token to headers
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.log(error);
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors globally
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response) {
      const status = error.response.status;
      let data = error.response.data;

      // Check if the error data is a Blob and parse it
      let parsedData = data;
      if (data instanceof Blob) {
        const text = await data.text();
        parsedData = JSON.parse(text);
        error.response.data = parsedData; // Update response data with parsed JSON
      }

      // Suppress specific "QR already generated" error from global logging
      if (status === 400 && parsedData.message === "QR already generated") {
        return Promise.reject(error); // Let the component handle this specific error
      }

      // Handle unauthorized errors (e.g., redirect to login)
      if (status === 401) {
        console.log(
          "Unauthorized access:",
          parsedData.message || error.message
        );
        window.location.href = "/login"; // Redirect to login route
      }
      // Handle forbidden errors (e.g., show alert)
      else if (status === 403) {
        console.log("Forbidden access:", parsedData.message || error.message);
        alert("You do not have permission to access this resource.");
      }
      // Handle not found errors (e.g., show alert)
      else if (status === 404) {
        console.log("Resource not found:", parsedData.message || error.message);
        alert("The requested resource was not found.");
      }
      // Handle server errors (e.g., show alert)
      else if (status >= 500) {
        console.log("Server error:", parsedData.message || error.message);
        alert("An error occurred on the server. Please try again later.");
      }
      // Handle other HTTP errors
      else {
        console.error("HTTP error:", parsedData.message || error.message);
        alert(parsedData.message || error.message);
      }
    } else {
      // Handle network errors
      console.error("Network error:", error.message);
      alert("Network error. Please check your connection.");
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
