// Complete src/utils/api.ts - Production-Ready Configuration
import { useCallback } from 'react';

// Mock data for development/fallback
const mockFolders = [
  {
    id: 1,
    name: "OTHERS",
    files: [
      { 
        id: "1", 
        name: "Sample Checklist 1", 
        customer: "Customer A", 
        prod_line: "Product X", 
        folder_id: 1, 
        groups: "ALL_SITES",
        json: { title: "Sample Survey" } 
      },
      { 
        id: "2", 
        name: "Sample Checklist 2", 
        customer: "Customer B", 
        prod_line: "Product Y", 
        folder_id: 1, 
        groups: "ALL_SITES",
        json: { title: "Sample Survey 2" } 
      }
    ]
  },
  {
    id: 2,
    name: "AMAT",
    files: [
      { 
        id: "3", 
        name: "AMAT Checklist", 
        customer: "AMAT Customer", 
        prod_line: "AMAT Product", 
        folder_id: 2, 
        groups: "ALL_SITES",
        json: { title: "AMAT Survey" } 
      }
    ]
  },
  {
    id: 3,
    name: "LAM",
    files: []
  },
  {
    id: 4,
    name: "Data_Collection",
    files: []
  },
  {
    id: 5,
    name: "TEST",
    files: [
      { 
        id: "4", 
        name: "Test Checklist", 
        customer: "Test Customer", 
        prod_line: "Test Product", 
        folder_id: 5, 
        groups: "ALL_SITES",
        json: { title: "Test Survey" } 
      }
    ]
  },
  {
    id: 6,
    name: "Parthib",
    files: []
  }
];

const mockSurvey = {
  json: {
    title: "Sample Survey",
    pages: [{
      name: "page1",
      elements: [{
        type: "text",
        name: "question1",
        title: "What is your name?"
      }, {
        type: "rating",
        name: "satisfaction",
        title: "How satisfied are you?",
        rateMax: 5
      }]
    }]
  },
  name: "Sample Survey"
};

const mockEmailList = [
  { Email: 'john.doe@company.com' },
  { Email: 'jane.smith@company.com' },
  { Email: 'dev.user@company.com' },
  { Email: 'test.user@company.com' }
];

function getMockData(endpoint: string): any {
  console.log(`📦 Returning mock data for: ${endpoint}`);
  
  // Handle different endpoint patterns
  if (endpoint === '/getFolders') {
    return { status: 200, data: mockFolders };
  }
  
  if (endpoint.includes('/folders/') && endpoint.includes('/files')) {
    const folderId = parseInt(endpoint.split('/')[2]);
    const folder = mockFolders.find(f => f.id === folderId);
    return { status: 200, data: folder?.files || [] };
  }
  
  if (endpoint.includes('/getSurvey')) {
    return { status: 200, data: mockSurvey };
  }
  
  if (endpoint.includes('/getTheme')) {
    return { status: 200, data: { theme: null } };
  }
  
  if (endpoint.includes('/results')) {
    return { status: 200, data: [] };
  }
  
  if (endpoint === '/getEmailList') {
    return { status: 200, data: mockEmailList };
  }
  
  if (endpoint.includes('/changeName')) {
    const updatedSurvey = {
      id: "updated-" + Date.now(),
      name: "Updated Survey",
      customer: "Updated Customer",
      prod_line: "Updated Product",
      folder_id: 1,
      groups: "ALL_SITES",
      json: mockSurvey.json
    };
    return { status: 200, data: updatedSurvey };
  }
  
  if (endpoint.includes('/delete')) {
    return { status: 200, data: { message: 'Deleted successfully' } };
  }
  
  // Default response
  return { status: 200, data: {} };
}

export const useApi = () => {
  const fetchData = useCallback(async (endpoint: string, requiresAuth: boolean = true) => {
    console.log(`🔄 API Call: ${endpoint}`);
    
    // Check if we should use mock data (only in development with explicit flag)
    const useMockData = process.env.NODE_ENV === 'development' && 
                       process.env.REACT_APP_USE_MOCK_DATA === 'true';
    
    if (useMockData) {
      console.log('🚀 Using mock data (development mode)');
      await new Promise(resolve => setTimeout(resolve, 200)); // Simulate network delay
      return getMockData(endpoint);
    }

    // Production mode - Make real API calls
    const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3002';
    
    if (!baseUrl) {
      console.error('❌ REACT_APP_API_BASE_URL is not defined');
      throw new Error('API base URL is not configured');
    }
    
    try {
      console.log(`🌐 Making real API call to: ${baseUrl}${endpoint}`);
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'GET',
        credentials: requiresAuth ? 'include' : 'same-origin',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ API call successful');
      return { status: response.status, data };
      
    } catch (error) {
      console.error(`❌ API Error for ${endpoint}:`, error);
      
      // Only fallback to mock data in development
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 API failed in development, falling back to mock data');
        return getMockData(endpoint);
      }
      
      // In production, throw the error
      throw error;
    }
  }, []);

  const postData = useCallback(async (endpoint: string, body: any, requiresAuth: boolean = true) => {
    console.log(`📤 POST API Call: ${endpoint}`, body);
    
    // Check if we should use mock data (only in development with explicit flag)
    const useMockData = process.env.NODE_ENV === 'development' && 
                       process.env.REACT_APP_USE_MOCK_DATA === 'true';
    
    if (useMockData) {
      console.log('🚀 Mock POST operation');
      await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay
      
      if (endpoint === '/folders') {
        const newFolder = { 
          id: Date.now(), 
          name: body.name, 
          files: [] 
        };
        return { status: 200, data: [newFolder] };
      }
      
      if (endpoint === '/create' || endpoint === '/duplicate') {
        const newSurvey = {
          id: Date.now().toString(),
          name: body.name,
          customer: body.customer,
          prod_line: body.product || body.prod_line,
          folder_id: body.folderId,
          groups: "ALL_SITES",
          json: body.json || mockSurvey.json
        };
        return { status: 200, data: newSurvey };
      }
      
      if (endpoint === '/post') {
        return { status: 200, data: { message: 'Survey response saved' } };
      }
      
      if (endpoint === '/changeJson') {
        return { status: 200, data: { message: 'Survey JSON updated' } };
      }
      
      if (endpoint === '/changeTheme') {
        return { status: 200, data: { message: 'Theme updated' } };
      }
      
      return { status: 200, data: { message: 'Mock POST success' } };
    }

    // Production mode - Make real API calls
    const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3002';
    
    if (!baseUrl) {
      console.error('❌ REACT_APP_API_BASE_URL is not defined');
      throw new Error('API base URL is not configured');
    }
    
    try {
      console.log(`🌐 Making real POST API call to: ${baseUrl}${endpoint}`);
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'POST',
        credentials: requiresAuth ? 'include' : 'same-origin',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ POST API call successful');
      return { status: response.status, data };
      
    } catch (error) {
      console.error(`❌ POST API Error for ${endpoint}:`, error);
      
      // Only fallback to mock data in development
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 POST API failed in development, returning mock success');
        return { status: 200, data: { message: 'Mock success (API failed)' } };
      }
      
      // In production, throw the error
      throw error;
    }
  }, []);

  const deleteData = useCallback(async (endpoint: string, requiresAuth: boolean = true) => {
    console.log(`🗑️ DELETE API Call: ${endpoint}`);
    
    // Check if we should use mock data (only in development with explicit flag)
    const useMockData = process.env.NODE_ENV === 'development' && 
                       process.env.REACT_APP_USE_MOCK_DATA === 'true';
    
    if (useMockData) {
      console.log('🚀 Mock DELETE operation');
      await new Promise(resolve => setTimeout(resolve, 200));
      return { status: 200, data: { message: 'Mock delete success' } };
    }

    // Production mode - Make real API calls
    const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3002';
    
    if (!baseUrl) {
      console.error('❌ REACT_APP_API_BASE_URL is not defined');
      throw new Error('API base URL is not configured');
    }
    
    try {
      console.log(`🌐 Making real DELETE API call to: ${baseUrl}${endpoint}`);
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'DELETE',
        credentials: requiresAuth ? 'include' : 'same-origin'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ DELETE API call successful');
      return { status: response.status, data };
      
    } catch (error) {
      console.error(`❌ DELETE API Error for ${endpoint}:`, error);
      
      // Only fallback to mock data in development
      if (process.env.NODE_ENV === 'development') {
        return { status: 200, data: { message: 'Mock delete success (API failed)' } };
      }
      
      // In production, throw the error
      throw error;
    }
  }, []);

  const putData = useCallback(async (endpoint: string, body: any, requiresAuth: boolean = true) => {
    console.log(`📝 PUT API Call: ${endpoint}`, body);
    
    // Check if we should use mock data (only in development with explicit flag)
    const useMockData = process.env.NODE_ENV === 'development' && 
                       process.env.REACT_APP_USE_MOCK_DATA === 'true';
    
    if (useMockData) {
      console.log('🚀 Mock PUT operation');
      await new Promise(resolve => setTimeout(resolve, 200));
      return { status: 200, data: { message: 'Mock PUT success' } };
    }

    // Production mode - Make real API calls
    const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3002';
    
    if (!baseUrl) {
      console.error('❌ REACT_APP_API_BASE_URL is not defined');
      throw new Error('API base URL is not configured');
    }
    
    try {
      console.log(`🌐 Making real PUT API call to: ${baseUrl}${endpoint}`);
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'PUT',
        credentials: requiresAuth ? 'include' : 'same-origin',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ PUT API call successful');
      return { status: response.status, data };
      
    } catch (error) {
      console.error(`❌ PUT API Error for ${endpoint}:`, error);
      
      // Only fallback to mock data in development
      if (process.env.NODE_ENV === 'development') {
        return { status: 200, data: { message: 'Mock PUT success (API failed)' } };
      }
      
      // In production, throw the error
      throw error;
    }
  }, []);

  return { fetchData, postData, deleteData, putData };
};