import axios, {AxiosInstance} from "axios";

interface ApiHook {
  fetchData: (endpoint: string) => Promise<any>;
  postData: (endpoint: string, payload: any) => Promise<any>;
}

export const useApi = (): ApiHook => {
  // Get base URL from environment variable or provide it directly
  const baseURL = process.env.REACT_APP_API_BASE_URL;

  // Check if base URL is defined
  if (!baseURL) {
    console.error("REACT_APP_API_BASE_URL is not defined.");
    return {
      fetchData: () => Promise.reject(new Error("API_BASE_URL not defined")),
      postData: () => Promise.reject(new Error("API_BASE_URL not defined")),
    };
  }

  // Create Axios instance with the base URL
  const api: AxiosInstance = axios.create({
    baseURL,
    withCredentials: true
  });

  // Function to make a GET request
  const fetchData = async (endpoint: string): Promise<any> => {
    try {
      console.log("-----fetchData api, endpoint: ", endpoint);
      const response = await api.get(endpoint);
      console.log("-----fetchData api, response", response);
      return response;
    } catch (error) {
      console.log("-----fetchData api, endpoint err:", endpoint, error);
      throw error;
    }
  };

  // Function to make a POST request
  const postData = async (endpoint: string, payload: any): Promise<any> => {
    try {
      console.log("-----postData api, endpoint: ", endpoint);
      const response = await api.post(endpoint, payload);
      console.log("-----postData api, response: ", response);
      return response;
    } catch (error) {
      console.log("-----postData api, endpoint err:", endpoint, error);
      throw error;
    }
  };

  return {
    fetchData,
    postData,
  };
};
