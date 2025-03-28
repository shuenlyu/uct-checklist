// require('dotenv').config();
import axios, { AxiosInstance } from "axios";
import axiosRetry from "axios-retry";
import Logger from "./logger";

// Configure axios to retry failed requests
axiosRetry(axios, { retries: 3, retryDelay: axiosRetry.exponentialDelay });

function envToBool(variable: string | undefined) {
  return variable === "true";
}
const DEBUG = envToBool(process.env.REACT_APP_DEBUG);

interface ApiHook {
  fetchData: (endpoint: string, requireAuthn?: boolean) => Promise<any>;
  postData: (
    endpoint: string,
    payload: any,
    requireAuth?: boolean
  ) => Promise<any>;
  deleteData: (endpoint: string, requireAuth?: boolean) => Promise<any>;
  putData: (
    endpoint: string,
    payload: any,
    requireAuth?: boolean
  ) => Promise<any>;
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
      deleteData: () => Promise.reject(new Error("API_BASE_URL not defined")),
      putData: () => Promise.reject(new Error("API_BASE_URL not defined")),
    };
  }

  // Create Axios instance with the base URL
  const apiWithAuth: AxiosInstance = axios.create({
    baseURL,
    withCredentials: true,
    timeout: 600000,
  });

  //Create Axios instance with the base URL and without credentials
  const apiWithoutAuth: AxiosInstance = axios.create({
    baseURL,
    withCredentials: false,
    timeout: 600000,
  });

  // Function to make a GET request
  const fetchData = async (
    endpoint: string,
    requireAuth = true
  ): Promise<any> => {
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
  const postData = async (
    endpoint: string,
    payload: any,
    requireAuth = true
  ): Promise<any> => {
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

  // Function to delete a resource
  const deleteData = async (
    endpoint: string,
    requireAuth = true
  ): Promise<any> => {
    try {
      const api = requireAuth ? apiWithAuth : apiWithoutAuth;
      Logger.debug("-----deleteData api, endpoint: ", endpoint);
      const response = await api.delete(endpoint);
      Logger.debug("-----deleteData api, response: ", response);
      return response;
    } catch (error) {
      Logger.error("-----deleteData api, endpoint err:", endpoint, error);
      throw error;
    }
  };

  const putData = async (
    endpoint: string,
    payload: any,
    requireAuth = true
  ): Promise<any> => {
    try {
      const api = requireAuth ? apiWithAuth : apiWithoutAuth;
      Logger.debug("-----putData api, endpoint: ", endpoint);
      const response = await api.put(endpoint, payload);
      return response;
    } catch (error) {
      Logger.error("-----putData api, endpoint err:", endpoint, error);
      throw error;
    }
  };

  return {
    fetchData,
    postData,
    deleteData,
    putData,
  };
};
