// require('dotenv').config();
import axios, { AxiosInstance } from "axios";
import Logger from "./logger";

function envToBool(variable: string | undefined) {
  return variable === 'true'
}
const DEBUG = envToBool(process.env.REACT_APP_DEBUG);

interface ApiHook {
  fetchData: (endpoint: string, requireAuthn?: boolean) => Promise<any>;
  postData: (endpoint: string, payload: any, requireAuth?: boolean) => Promise<any>;
}

export const useApi = (): ApiHook => {
  // Get base URL from environment variable or provide it directly
  const baseURL = process.env.REACT_APP_API_BASE_URL;

  // Check if base URL is defined
  if (!baseURL) {
    Logger.error("REACT_APP_API_BASE_URL is not defined.");
    return {
      fetchData: () => Promise.reject(new Error("API_BASE_URL not defined")),
      postData: () => Promise.reject(new Error("API_BASE_URL not defined")),
    };
  }

  // Create Axios instance with the base URL
  const apiWithAuth: AxiosInstance = axios.create({
    baseURL,
    withCredentials: true
  });

  //Create Axios instance with the base URL and without credentials
  const apiWithoutAuth: AxiosInstance = axios.create({
    baseURL,
    withCredentials: false
  });

  // Function to make a GET request
  const fetchData = async (endpoint: string, requireAuth = true): Promise<any> => {
    try {
      const api = requireAuth ? apiWithAuth : apiWithoutAuth;

      Logger.debug("-----fetchData api, endpoint: ", endpoint);
      const response = await api.get(endpoint);
      Logger.debug("-----fetchData api, response", response);
      return response;
    } catch (error) {
      Logger.error("-----fetchData api, endpoint err:", endpoint, error);
      throw error;
    }
  };

  // Function to make a POST request
  const postData = async (endpoint: string, payload: any, requireAuth = true): Promise<any> => {
    try {
      const api = requireAuth ? apiWithAuth : apiWithoutAuth;
      Logger.debug("-----postData api, endpoint: ", endpoint);
      const response = await api.post(endpoint, payload);
      Logger.debug("-----postData api, response: ", response);
      return response;
    } catch (error) {
      Logger.error("-----postData api, endpoint err:", endpoint, error);
      throw error;
    }
  };

  return {
    fetchData,
    postData,
  };
};
