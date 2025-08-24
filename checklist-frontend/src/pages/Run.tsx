// Run.tsx - Fixed with proper authentication, working 'New' button, debugging tools, and FIXED In Flight resume support
import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router";
import { Link } from 'react-router-dom';
import {
  ITheme,
  matrixDropdownColumnTypes,
  Model,
  Serializer,
} from "survey-core";
import "survey-core/defaultV2.css";
import { Survey } from "survey-react-ui";
import { SurveyQuestionEditorDefinition } from "survey-creator-core";
import { useApi } from "../utils/api";
import { themes, themeOptions } from "../utils/themeOptions";
import Logger from "../utils/logger";
import Loading from "../components/Loading";
import navlogo from "../OneUCT_Logo.png";

// Global window interface
declare global {
  interface Window {
    rerunSurvey: () => void;
    generateUniversalPDF: () => Promise<void>;
    emailPDF: () => Promise<void>;
    saveToSharedFolder: () => Promise<void>;
    surveyModel: Model | null;
  }
}

// SurveyJS extensions
matrixDropdownColumnTypes.signaturepad = {};
SurveyQuestionEditorDefinition.definition["matrixdropdowncolumn@signaturepad"] = {};
matrixDropdownColumnTypes.image = {};
SurveyQuestionEditorDefinition.definition["matrixdropdowncolumn@image"] = {};

interface ResultItem {
  createdAt: string;
  id: string;
  json: string;
  postid: string;
  submittedBy: string;
}

interface PDFMetadata {
  title: string;
  systemName: string;
  organizationName: string;
  logo?: string;
  additionalInfo?: string;
  showMetadata?: boolean;
}

interface PageProgress {
  pageIndex: number;
  pageData: any;
  completedBy: string;
  completedAt: string;
  isCompleted: boolean;
}

interface CurrentProgress {
  currentData: any;
  currentPageNo: number;
  lastEditedBy: string;
  updatedAt: string;
}

interface AuthenticatedUser {
  email: string;
  name?: string;
  displayName?: string;
  isAuthenticated: boolean;
}

// Initialize model from URL parameters
function initializeModelFromURL(search: string, modelData: any) {
  const queryParams = new URLSearchParams(search);
  const model = new Model(modelData);
  
  const allQuestions = model.getAllQuestions();
  
  allQuestions.forEach((question) => {
    if (question.contentPanel) {
      queryParams.forEach((value, key) => {
        const subquestion = question.contentPanel.getQuestionByName(key);
        if (subquestion) {
          subquestion.value = value;
        }
      });
    } else {
      const paramValue = queryParams.get(question.name);
      if (paramValue) {
        question.value = paramValue;
      }
    }
  });

  return model;
}

// Deep merge utility
function mergeDeep(target: any, source: any) {
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (target.hasOwnProperty(key)) {
        if (
          typeof target[key] === "object" &&
          typeof source[key] === "object"
        ) {
          mergeDeep(target[key], source[key]);
        }
      } else {
        target[key] = source[key];
      }
    }
  }
  return target;
}

// Universal PDF generation function
async function generateUniversalPDF(surveyModel: Model, userId: string, checklistName: string = 'Checklist') {
  try {
    Logger.info("Starting Universal PDF generation...");
    
    const PDF_SERVER_URL = process.env.REACT_APP_PDF_SERVER_URL || 'https://dc-analytics01.uct.local';
    
    const surveyJson = surveyModel.toJSON();
    const surveyData = surveyModel.data;
    
    const enhancedSurveyData = { ...surveyData };
    
    const allQuestions = surveyModel.getAllQuestions();
    allQuestions.forEach((question: any) => {
      const questionValue = question.value;
      if (questionValue !== undefined && questionValue !== null) {
        enhancedSurveyData[question.name] = questionValue;
      }
    });
    
    const plainData = surveyModel.getPlainData({ includeEmpty: false });
    plainData.forEach((item: any) => {
      if (item.name && item.value !== undefined && item.value !== null) {
        enhancedSurveyData[item.name] = item.value;
      }
    });
    
    const queryParams = new URLSearchParams(window.location.search);
    const urlMetadata: any = {};
    queryParams.forEach((value, key) => {
      urlMetadata[key] = value;
    });
    
    const metadata: PDFMetadata = {
      title: surveyJson.title || checklistName || 'Checklist Results',
      systemName: 'Checklist Manager System',
      organizationName: 'UCT',
      logo: '',
      additionalInfo: `Generated for user: ${userId}`,
      showMetadata: true
    };
    
    const requestData = {
      surveyJson: surveyJson,
      surveyData: enhancedSurveyData,
      metadata: metadata,
      urlParams: urlMetadata,
      fileName: `${checklistName.replace(/[^a-zA-Z0-9]/g, '_')}-${userId.replace('@', '_at_')}-${new Date().toISOString().split('T')[0]}.pdf`
    };
    
    Logger.info("Sending data to Universal PDF Generator:", {
      surveyTitle: surveyJson.title,
      dataKeys: Object.keys(enhancedSurveyData),
      questionCount: allQuestions.length,
      pageCount: surveyJson.pages?.length || 0
    });
    
    const response = await fetch(`${PDF_SERVER_URL}/generate-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText };
      }
      Logger.error("PDF server response error:", errorData);
      throw new Error(`Universal PDF generation failed: ${errorData.error || 'Unknown error'}`);
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = requestData.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    Logger.info("Universal PDF downloaded successfully:", requestData.fileName);
    return true;
    
  } catch (error) {
    Logger.error("Universal PDF generation failed:", error);
    throw error;
  }
}

// Email PDF function
async function emailPDF(surveyModel: Model, userId: string, checklistName: string = 'Checklist') {
  try {
    Logger.info("Starting Email PDF...");
    
    const PDF_SERVER_URL = process.env.REACT_APP_PDF_SERVER_URL || 'https://dc-analytics01.uct.local';
    
    const surveyJson = surveyModel.toJSON();
    const surveyData = surveyModel.data;
    
    const enhancedSurveyData = { ...surveyData };
    const allQuestions = surveyModel.getAllQuestions();
    
    allQuestions.forEach((question: any) => {
      const questionValue = question.value;
      if (questionValue !== undefined && questionValue !== null) {
        enhancedSurveyData[question.name] = questionValue;
      }
    });
    
    const metadata: PDFMetadata = {
      title: surveyJson.title || checklistName || 'Checklist Results',
      systemName: 'Checklist Manager System',
      organizationName: 'UCT',
      logo: '',
      additionalInfo: `Generated for user: ${userId}`,
      showMetadata: true
    };
    
    const recipientEmail = window.prompt('Enter recipient email address:');
    if (!recipientEmail) {
      Logger.info("Email cancelled by user");
      return;
    }
    
    const requestData = {
      surveyJson: surveyJson,
      surveyData: enhancedSurveyData,
      metadata: metadata,
      fileName: `${checklistName.replace(/[^a-zA-Z0-9]/g, '_')}-${userId.replace('@', '_at_')}-${new Date().toISOString().split('T')[0]}.pdf`,
      recipientEmail: recipientEmail,
      senderName: userId,
      subject: `Checklist Report: ${checklistName}`
    };
    
    const response = await fetch(`${PDF_SERVER_URL}/email-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText };
      }
      Logger.error("Email PDF server response error:", errorData);
      throw new Error(`Email PDF failed: ${errorData.error || 'Unknown error'}`);
    }
    
    const result = await response.json();
    Logger.info("Email sent successfully:", result);
    window.alert(`PDF emailed successfully to ${recipientEmail}!`);
    
    return true;
    
  } catch (error) {
    Logger.error("Email PDF failed:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    window.alert(`Email failed: ${errorMessage}`);
    throw error;
  }
}

// Save to shared folder function
async function saveToSharedFolder(surveyModel: Model, userId: string, checklistName: string = 'Checklist') {
  try {
    Logger.info("Starting Save to Shared Folder...");
    
    const PDF_SERVER_URL = process.env.REACT_APP_PDF_SERVER_URL || 'https://dc-analytics01.uct.local';
    
    const surveyJson = surveyModel.toJSON();
    const surveyData = surveyModel.data;
    
    const enhancedSurveyData = { ...surveyData };
    const allQuestions = surveyModel.getAllQuestions();
    
    allQuestions.forEach((question: any) => {
      const questionValue = question.value;
      if (questionValue !== undefined && questionValue !== null) {
        enhancedSurveyData[question.name] = questionValue;
      }
    });
    
    const metadata: PDFMetadata = {
      title: surveyJson.title || checklistName || 'Checklist Results',
      systemName: 'Checklist Manager System',
      organizationName: 'UCT',
      logo: '',
      additionalInfo: `Generated for user: ${userId}`,
      showMetadata: true
    };
    
    const requestData = {
      surveyJson: surveyJson,
      surveyData: enhancedSurveyData,
      metadata: metadata,
      fileName: `${checklistName.replace(/[^a-zA-Z0-9]/g, '_')}-${userId.replace('@', '_at_')}-${new Date().toISOString().split('T')[0]}.pdf`,
      userId: userId
    };
    
    const response = await fetch(`${PDF_SERVER_URL}/save-to-shared-folder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText };
      }
      Logger.error("Shared folder save server response error:", errorData);
      throw new Error(`Shared folder save failed: ${errorData.error || 'Unknown error'}`);
    }
    
    const result = await response.json();
    Logger.info("Shared folder save successful:", result);
    window.alert(`PDF saved successfully to shared folder: ${result.filePath || 'Success'}`);
    
    return true;
    
  } catch (error) {
    Logger.error("Shared folder save failed:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    window.alert(`Shared folder save failed: ${errorMessage}`);
    throw error;
  }
}

// Enhanced fallback print function
function enhancedPrintFallback() {
  Logger.info("Using enhanced print fallback");
  
  const printStyles = `
    <style id="universal-print-styles">
      @media print {
        * {
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
        
        body {
          margin: 0 !important;
          padding: 0 !important;
          font-family: Arial, sans-serif !important;
          font-size: 12px !important;
          line-height: 1.4 !important;
        }
        
        body * {
          visibility: hidden;
        }
        
        .sv-root,
        .sv-root *,
        .sv_main,
        .sv_main *,
        .sv-container,
        .sv-container *,
        .sv_body,
        .sv_body *,
        .sv_page,
        .sv_page *,
        .sv_qstn,
        .sv_qstn *,
        .sv_q,
        .sv_q * {
          visibility: visible !important;
        }
        
        .sv-root {
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          width: 100% !important;
          margin: 0 !important;
          padding: 15mm !important;
          box-sizing: border-box !important;
        }
        
        .no-print,
        header,
        .theme-bg-header,
        nav,
        button:not(.sv_btn),
        .sv_nav,
        .sv_progress,
        .sv_complete_btn,
        .sv_btn {
          display: none !important;
          visibility: hidden !important;
        }
      }
      
      @page {
        margin: 15mm;
        size: A4;
      }
    </style>
  `;
  
  const existingStyles = document.getElementById('universal-print-styles');
  if (existingStyles) {
    existingStyles.remove();
  }
  
  document.head.insertAdjacentHTML('beforeend', printStyles);
  
  window.alert('Using browser print dialog. Please select "Save as PDF" when the dialog opens.');
  
  setTimeout(() => {
    window.print();
    
    setTimeout(() => {
      const stylesToRemove = document.getElementById('universal-print-styles');
      if (stylesToRemove) {
        stylesToRemove.remove();
      }
    }, 1000);
  }, 100);
}

const Run = () => {
  const { id } = useParams();
  const location = useLocation();
  const { result_id: initialResultId } = location.state || {};
  let result_id = initialResultId;

  const queryParams = new URLSearchParams(window.location.search);
  
  const fallbackUserId: string = queryParams.get("inspectedby")
    ? queryParams.get("inspectedby")!
    : (queryParams.get("userid") ? queryParams.get("userid")! : "noname");

  result_id = queryParams.get("id") || result_id;
  let viewOnly = false;
  if (queryParams.get("view") === "1") {
    viewOnly = true;
  }

  const loadExisting = queryParams.get("load_existing") === "true" || 
                      queryParams.get("resume_progress") === "true" ||
                      result_id !== undefined || 
                      queryParams.get("edit") === "true";

  const isResumeRequest = queryParams.get("resume_progress") === "true";

  const { fetchData, postData } = useApi();
  
  // State variables
  const [survey, setSurvey] = useState({ json: "", name: " " });
  const [result, setResult] = useState({});
  const [theme, setTheme] = useState<ITheme>(themes[0]);
  const [surveyModel, setSurveyModel] = useState<Model | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isEmailingPDF, setIsEmailingPDF] = useState(false);
  const [isSavingToSharedFolder, setIsSavingToSharedFolder] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [completedSurveyData, setCompletedSurveyData] = useState<any>(null);
  const [selectedThemeIndex, setSelectedThemeIndex] = useState<number>(0);
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);
  const [pageProgress, setPageProgress] = useState<PageProgress[]>([]);
  const [currentProgress, setCurrentProgress] = useState<CurrentProgress | null>(null); // NEW: Current progress state
  const [isSubmittingPage, setIsSubmittingPage] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [authenticatedUser, setAuthenticatedUser] = useState<AuthenticatedUser | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isClearing, setIsClearing] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false); // NEW: Track when all data is loaded

  // DEBUG FUNCTIONS (keeping your debug functions)
  const debugAuthentication = async () => {
    console.log("=== MANUAL AUTHENTICATION DEBUG ===");
    
    try {
      const response = await fetch('/getMe', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      console.log("Raw fetch response status:", response.status);
      console.log("Raw fetch response headers:", Array.from(response.headers.entries()));
      
      if (response.ok) {
        const data = await response.json();
        console.log("Raw /getMe response data:", data);
        
        if (data.user) {
          console.log("User object keys:", Object.keys(data.user));
          console.log("User email:", data.user.email);
          console.log("User name:", data.user.name);
          console.log("User displayName:", data.user.displayName);
          console.log("Full user object:", JSON.stringify(data.user, null, 2));
        }
      } else {
        const errorText = await response.text();
        console.log("Error response:", errorText);
      }
      
      console.log("=== BROWSER STORAGE ===");
      console.log("LocalStorage keys:", Object.keys(localStorage));
      console.log("SessionStorage keys:", Object.keys(sessionStorage));
      console.log("Document cookies:", document.cookie);
      
      console.log("=== CURRENT AUTH STATE ===");
      console.log("authenticatedUser:", authenticatedUser);
      console.log("isLoadingUser:", isLoadingUser);
      console.log("fallbackUserId:", fallbackUserId);
      
    } catch (error) {
      console.error("Debug authentication failed:", error);
    }
  };

  const debugPageValidation = () => {
    console.log("=== PAGE VALIDATION DEBUG ===");
    
    if (!surveyModel) {
      console.log("No survey model found");
      return;
    }
    
    const currentPage = surveyModel.currentPage;
    console.log("Current page:", currentPage);
    console.log("Current page name:", currentPage.name);
    console.log("Current page index:", surveyModel.currentPageNo);
    
    console.log("=== QUESTIONS ON CURRENT PAGE ===");
    currentPage.questions.forEach((question: any, index: number) => {
      console.log(`Question ${index + 1}:`);
      console.log("  - Name:", question.name);
      console.log("  - Title:", question.title);
      console.log("  - Type:", question.type);
      console.log("  - Required:", question.isRequired);
      console.log("  - Value:", question.value);
      console.log("  - Is Empty:", question.isEmpty());
      console.log("  - Has Errors:", question.hasErrors());
      console.log("  - Errors:", question.errors);
      console.log("  - Validation:", question.validate());
      console.log("  ---");
    });
    
    console.log("=== PAGE VALIDATION RESULT ===");
    const isValid = currentPage.validate();
    console.log("Page validation result:", isValid);
    console.log("Page errors:", currentPage.errors);
    console.log("Page has errors:", currentPage.hasErrors());
    
    console.log("=== AUTHENTICATION FOR SUBMIT ===");
    console.log("Authenticated user:", authenticatedUser);
    console.log("Is authenticated:", authenticatedUser?.isAuthenticated);
    console.log("Can submit:", isValid && authenticatedUser?.isAuthenticated);
    
    console.log("=== CURRENT SURVEY DATA ===");
    console.log("Survey data:", surveyModel.data);
    console.log("Survey data keys:", Object.keys(surveyModel.data || {}));
    
    // NEW: Debug resume data
    console.log("=== RESUME DATA DEBUG ===");
    console.log("Is resume request:", isResumeRequest);
    console.log("Load existing:", loadExisting);
    console.log("Page progress:", pageProgress);
    console.log("Current progress:", currentProgress);
    console.log("Data loaded:", dataLoaded);
  };

  const getCurrentUser = async () => {
    setIsLoadingUser(true);
    try {
      console.log("=== Fetching current user ===");
      
      const response = await fetchData("/getMe", false);
      
      console.log("GetMe response:", response);
      
      if (isResumeRequest) {
        console.log("Resume request detected - will load progress data");
        Logger.info("Resume request detected for checklist:", id);
      }
      
      if (response && response.data && response.data.user && response.data.authenticated) {
        const user: AuthenticatedUser = {
          email: response.data.user.email || 'unknown@company.com',
          name: response.data.user.name || response.data.user.displayName || response.data.user.email,
          displayName: response.data.user.displayName || response.data.user.name,
          isAuthenticated: true
        };
        
        setAuthenticatedUser(user);
        console.log("User authenticated successfully:", user);
        Logger.info("Current user authenticated:", user.email);
        return;
      }
      
      throw new Error("Invalid authentication response - missing user data");
      
    } catch (error) {
      console.log("Authentication failed:", error);
      Logger.warn("User not authenticated:", error);
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        console.log("User is not logged in to Okta");
        setAuthenticatedUser({
          email: fallbackUserId,
          name: fallbackUserId,
          isAuthenticated: false
        });
      } else {
        console.log("Network or other error, checking for cached auth");
        
        const hasAuthIndicator = localStorage.getItem('okta-token-storage') || 
                                sessionStorage.getItem('okta-token-storage') ||
                                document.cookie.includes('okta') ||
                                document.cookie.includes('connect.sid');
        
        if (hasAuthIndicator) {
          console.log("Found auth indicators, treating as authenticated with fallback data");
          setAuthenticatedUser({
            email: fallbackUserId !== "noname" ? fallbackUserId : "authenticated.user@company.com",
            name: fallbackUserId !== "noname" ? fallbackUserId : "Authenticated User",
            isAuthenticated: true
          });
        } else {
          console.log("No auth indicators found, using fallback");
          setAuthenticatedUser({
            email: fallbackUserId,
            name: fallbackUserId,
            isAuthenticated: false
          });
        }
      }
    } finally {
      setIsLoadingUser(false);
    }
  };

  const getEffectiveUserId = (): string => {
    if (authenticatedUser?.isAuthenticated) {
      return authenticatedUser.email;
    }
    return fallbackUserId;
  };

  const getDisplayName = (): string => {
    if (authenticatedUser?.isAuthenticated) {
      return authenticatedUser.name || authenticatedUser.email;
    }
    return fallbackUserId;
  };

 const loadProgress = async () => {
  try {
    // Direct fetch instead of using fetchData utility
    const response = await fetch(`/getProgress?postId=${id}`);
    const result = await response.json();
    
    console.log("Direct loadProgress result:", result);
    console.log("result.data:", result.data);
    
    const progressData = result?.data || [];
    console.log("progressData:", progressData);
    console.log("progressData length:", progressData.length);
    
    setPageProgress(Array.isArray(progressData) ? progressData : []);
    Logger.info("Page progress loaded:", progressData?.length || 0, "pages");
  } catch (error) {
    Logger.debug("No existing progress found");
    setPageProgress([]);
  }
};

 const loadCurrentProgress = async () => {
  try {
    // Direct fetch instead of using fetchData utility
    const response = await fetch(`/getCurrentProgress?postId=${id}`);
    const result = await response.json();
    
    console.log("Direct loadCurrentProgress result:", result);
    
    const currentProgressData = result?.data;
    if (currentProgressData && currentProgressData.currentData) {
      setCurrentProgress(currentProgressData);
      Logger.info("Current progress loaded - page:", currentProgressData.currentPageNo, "fields:", Object.keys(currentProgressData.currentData).length);
      return currentProgressData;
    } else {
      Logger.debug("No current progress found");
      setCurrentProgress(null);
      return null;
    }
  } catch (error) {
    Logger.debug("No current progress found");
    setCurrentProgress(null);
    return null;
  }
};

const loadAllProgressData = async () => {
  console.log("=== LOADING ALL PROGRESS DATA ===");
  
  if (!surveyModel || isClearing) {
    console.log("Skipping progress load - no survey model or clearing");
    return;
  }
  
  try {
    console.log("Step 1: About to call loadProgress");
    await loadProgress(); // Completed pages
    console.log("Step 2: loadProgress completed, about to call loadCurrentProgress");
    
    const currentProgressData = await loadCurrentProgress(); // Current work-in-progress
    console.log("Step 3: loadCurrentProgress completed, data:", currentProgressData);
    
    let allData = {};
    
    console.log("Step 4: Processing pageProgress, length:", pageProgress.length);
    // 1. First, merge completed page data
    pageProgress.forEach(progress => {
      if (progress.isCompleted && progress.pageData) {
        allData = { ...allData, ...progress.pageData };
        console.log("Merged completed page data:", Object.keys(progress.pageData));
      }
    });
    
    console.log("Step 5: Processing currentProgress");
    // 2. Then, merge current progress data (this takes precedence)
    if (currentProgressData && currentProgressData.currentData) {
      allData = { ...allData, ...currentProgressData.currentData };
      console.log("Merged current progress data:", Object.keys(currentProgressData.currentData));
    }
    
    console.log("Step 6: Applying data to survey model");
    // 3. Apply all data to survey model
    if (Object.keys(allData).length > 0) {
      surveyModel.data = mergeDeep(surveyModel.data, allData);
      console.log("Applied total merged data:", Object.keys(allData).length, "fields");
      Logger.info("Applied all progress data:", Object.keys(allData).length, "fields");
    }
    
    console.log("Step 7: Navigation for resume");
    // 4. FIXED: Navigate to correct page for resume requests
    if (isResumeRequest && currentProgressData) {
      const targetPage = currentProgressData.currentPageNo || 0;
      console.log(`Navigating to resumed page: ${targetPage + 1} of ${surveyModel.pageCount}`);
      surveyModel.currentPageNo = targetPage;
      Logger.info(`Resumed checklist to page ${targetPage + 1}`);
    }
    
    setDataLoaded(true);
    console.log("=== ALL PROGRESS DATA LOADED AND APPLIED ===");
    
  } catch (error) {
    console.error("Error in loadAllProgressData:", error);
    Logger.error("Error loading progress data:", error);
    setDataLoaded(true); // Still mark as loaded to prevent blocking
  }
};

  // Auto-save current progress
  const autoSaveProgress = async (model: Model) => {
    if (isAutoSaving || !authenticatedUser?.isAuthenticated || isClearing) return;
    
    setIsAutoSaving(true);
    try {
      await postData("/saveProgress", {
        postId: id as string,
        currentData: model.data,
        currentPageNo: model.currentPageNo,
        userId: getEffectiveUserId()
      }, false);
      
      Logger.debug("Auto-saved progress");
    } catch (error) {
      Logger.debug("Auto-save failed");
    } finally {
      setIsAutoSaving(false);
    }
  };

  // Submit current page
  const submitCurrentPage = async () => {
    if (!surveyModel || isSubmittingPage) return;
    
    if (!authenticatedUser?.isAuthenticated) {
      alert("Please log in to Okta to submit pages. You can view the checklist but cannot save progress without authentication.");
      window.location.href = "/login";
      return;
    }
    
    const currentPage = surveyModel.currentPage;
    if (!currentPage.validate()) {
      alert("Please complete all required fields on this page before submitting.");
      return;
    }
    
    setIsSubmittingPage(true);
    try {
      const pageData: any = {};
      currentPage.questions.forEach((question: any) => {
        if (question.value !== undefined && question.value !== null) {
          pageData[question.name] = question.value;
        }
      });
      
      await postData("/submitPage", {
        postId: id as string,
        pageIndex: surveyModel.currentPageNo,
        pageData: pageData,
        userId: getEffectiveUserId()
      }, false);
      
      await loadProgress(); // Reload page progress after submission
      
      if (surveyModel.currentPageNo < surveyModel.pageCount - 1) {
        surveyModel.nextPage();
      }
      
      Logger.info("Page submitted successfully");
      alert("Page submitted successfully!");
      
    } catch (error) {
      Logger.error("Page submission failed:", error);
      alert("Failed to submit page. Please try again.");
    } finally {
      setIsSubmittingPage(false);
    }
  };

  // Check if current page is completed
  const isCurrentPageCompleted = () => {
    if (!surveyModel || !Array.isArray(pageProgress)) return false;
    return pageProgress.some(p => p.pageIndex === surveyModel.currentPageNo && p.isCompleted);
  };

  // Check if all pages are completed
  const areAllPagesCompleted = () => {
    if (!surveyModel || !Array.isArray(pageProgress)) return false;
    const totalPages = surveyModel.pageCount;
    const completedPages = pageProgress.filter(p => p.isCompleted).length;
    return completedPages === totalPages;
  };

  // Start new checklist function
  const startNewChecklist = async () => {
    const confirmed = window.confirm("Start a new checklist? This will clear all current data.");
    if (confirmed) {
      try {
        setIsClearing(true);
        
        if (authenticatedUser?.isAuthenticated) {
          try {
            await postData("/clearProgress", {
              postId: id as string,
              userId: getEffectiveUserId()
            }, false);
            console.log("Server progress cleared");
          } catch (error) {
            console.log("No existing progress to clear or clear failed:", error);
          }
        }
        
        setPageProgress([]);
        setCurrentProgress(null); // NEW: Clear current progress
        setCompletedSurveyData(null);
        setIsCompleted(false);
        setResult({});
        setDataLoaded(false); // NEW: Reset data loaded state
        
        if (surveyModel) {
          const beforeData = { ...surveyModel.data };
          surveyModel.clear(true);
          surveyModel.data = {};
          surveyModel.currentPageNo = 0;
          surveyModel.mode = "edit";
          
          console.log("Survey cleared - Before:", beforeData);
          console.log("Survey cleared - After:", surveyModel.data);
          
          surveyModel.trigger("valueChanged", surveyModel, {
            name: "__clear_all__",
            value: null,
            oldValue: null
          });
        }
        
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('load_existing');
        newUrl.searchParams.delete('resume_progress');
        newUrl.searchParams.delete('edit');
        newUrl.searchParams.delete('id');
        window.history.replaceState({}, '', newUrl.toString());
        
        console.log("New checklist started successfully");
        Logger.info("Started new checklist - all data cleared");
        
      } catch (error) {
        console.error("Error starting new checklist:", error);
        alert("There was an error starting a new checklist. Please refresh the page and try again.");
      } finally {
        setTimeout(() => {
          setIsClearing(false);
        }, 1000);
      }
    }
  };

  // Handle theme change
  const handleThemeChange = (themeIndex: number) => {
    const newTheme = themes[themeIndex];
    setTheme(newTheme);
    setSelectedThemeIndex(themeIndex);
    setShowThemeDropdown(false);
    
    if (surveyModel) {
      surveyModel.applyTheme(newTheme);
      Logger.info("Theme changed to:", themeOptions.find(opt => opt.value === themeIndex.toString())?.label);
    }
  };

  // Initialize model when survey data is available
  useEffect(() => {
    if (survey.json) {
      const model = initializeModelFromURL(window.location.search, survey.json);
      
      Logger.info("Model Initialized with Universal PDF Generator support");
      Logger.info("Survey details:", {
        questions: model.getAllQuestions().length,
        pages: model.pages.length,
        title: model.title,
        loadExisting,
        isResumeRequest
      });
      
      // Setup auto-save on data change
      model.onValueChanged.add((sender) => {
        if (!isClearing) {
          autoSaveProgress(sender);
        }
      });

      // Setup page change handler
      model.onCurrentPageChanged.add((sender) => {
        if (!isClearing) {
          autoSaveProgress(sender);
        }
      });
      
      // Set up rerun function
      const rerunSurvey = () => {
        Logger.info("Rerunning survey");
        setIsCompleted(false);
        setCompletedSurveyData(null);
        model.clear(false);
        model.mode = "edit";
      };
      window.rerunSurvey = rerunSurvey;

      // Make survey model available globally for debugging
      window.surveyModel = model;

      // Set up Universal PDF generation function
      const generateUniversalPDFWrapper = async () => {
        if (isGeneratingPDF) {
          Logger.warn("PDF generation already in progress");
          return;
        }
        
        setIsGeneratingPDF(true);
        
        try {
          const dataToUse = completedSurveyData || model.data;
          const hasData = dataToUse && Object.keys(dataToUse).length > 0;
          
          if (!hasData) {
            Logger.warn("Checklist has no data - generating PDF with empty responses");
          }
          
          const tempModel = new Model(model.toJSON());
          tempModel.data = dataToUse;
          
          await generateUniversalPDF(tempModel, getEffectiveUserId(), survey.name || 'Checklist');
          
        } catch (error) {
          Logger.error("Universal PDF generation failed:", error);
          
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          
          const usesFallback = window.confirm(
            `PDF generation failed: ${errorMessage}\n\nWould you like to use the browser print dialog as a fallback?`
          );
          
          if (usesFallback) {
            enhancedPrintFallback();
          }
        } finally {
          setIsGeneratingPDF(false);
        }
      };
      window.generateUniversalPDF = generateUniversalPDFWrapper;

      // Set up Email PDF function
      const emailPDFWrapper = async () => {
        if (isEmailingPDF) return;
        
        setIsEmailingPDF(true);
        
        try {
          const dataToUse = completedSurveyData || model.data;
          const tempModel = new Model(model.toJSON());
          tempModel.data = dataToUse;
          
          await emailPDF(tempModel, getEffectiveUserId(), survey.name || 'Checklist');
        } catch (error) {
          Logger.error("Email PDF failed:", error);
        } finally {
          setIsEmailingPDF(false);
        }
      };
      window.emailPDF = emailPDFWrapper;

      // Set up Save to Shared Folder function
      const saveToSharedFolderWrapper = async () => {
        if (isSavingToSharedFolder) return;
        
        setIsSavingToSharedFolder(true);
        
        try {
          const dataToUse = completedSurveyData || model.data;
          const tempModel = new Model(model.toJSON());
          tempModel.data = dataToUse;
          
          await saveToSharedFolder(tempModel, getEffectiveUserId(), survey.name || 'Checklist');
        } catch (error) {
          Logger.error("Shared folder save failed:", error);
        } finally {
          setIsSavingToSharedFolder(false);
        }
      };
      window.saveToSharedFolder = saveToSharedFolderWrapper;

      // Configure serialization
      Serializer.getProperty("survey", "clearInvisibleValues").defaultValue = "none";

      // Set up completion handler
      model.completedHtml = `
        <div class="bg-white rounded-lg p-8 text-center">
          <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h2 class="text-2xl font-bold text-gray-900 mb-2">Checklist Completed Successfully!</h2>
          <p class="text-gray-600 mb-6">Your checklist has been completed successfully.</p>
          
          <div class="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <button class="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200" onclick="window.rerunSurvey()">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
              Run Checklist Again
            </button>
            <button class="inline-flex items-center px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors duration-200 ${isGeneratingPDF ? 'opacity-50 cursor-not-allowed' : ''}" onclick="window.generateUniversalPDF()" ${isGeneratingPDF ? 'disabled' : ''}>
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              ${isGeneratingPDF ? 'Generating PDF...' : 'Download PDF'}
            </button>
            <button class="inline-flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200 ${isEmailingPDF ? 'opacity-50 cursor-not-allowed' : ''}" onclick="window.emailPDF()" ${isEmailingPDF ? 'disabled' : ''}>
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
              </svg>
              ${isEmailingPDF ? 'Sending...' : 'Email PDF'}
            </button>
            <button class="inline-flex items-center px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors duration-200 ${isSavingToSharedFolder ? 'opacity-50 cursor-not-allowed' : ''}" onclick="window.saveToSharedFolder()" ${isSavingToSharedFolder ? 'disabled' : ''}>
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4-1v8m0 0l-3-3m-3 3L9 8m-5 5h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H17M13 13h8m0 0V9m0 4l-3-3"></path>
              </svg>
              ${isSavingToSharedFolder ? 'Saving...' : 'Save to Shared Folder'}
            </button>
          </div>
        </div>
      `;

      // Set view mode
      if (viewOnly) {
        model.mode = "display";
      }

      // Set up completion handler
      model.onComplete.add(async (sender: Model) => {
        Logger.debug("Checklist completed:", {
          dataKeys: Object.keys(sender.data),
          questionCount: sender.getAllQuestions().length
        });
        
        setCompletedSurveyData({ ...sender.data });
        setIsCompleted(true);
        
        await postData(
          "/post",
          {
            postId: id as string,
            surveyResult: sender.data,
            userId: getEffectiveUserId(),
            createdAt: new Date().toISOString(),
          },
          false
        );
        
        Logger.info("Checklist completed and data preserved");
      });

      setSurveyModel(model);
    }
  }, [survey.json, id, viewOnly, postData, isGeneratingPDF, isEmailingPDF, isSavingToSharedFolder, loadExisting, authenticatedUser, isClearing]);

  // Get survey data
  const getSurvey = async () => {
    try {
      const response = await fetchData("/getSurvey?surveyId=" + id, false);
      Logger.info("Checklist data received:", {
        title: response.data.name,
        hasJson: !!response.data.json
      });
      setSurvey(response.data);
    } catch (error) {
      Logger.error("Error getting checklist:", error);
    }
  };

  // Get existing results
  const getResults = async () => {
    try {
      const response = await fetchData("/results?postId=" + id, false);
      Logger.debug("Results received:", response.data.length, "items");

      if (response.data.length > 0) {
        if (result_id) {
          const filteredArray = response.data.filter(
            (item: ResultItem) => item.id === result_id
          );
          if (filteredArray.length > 0) {
            setResult(JSON.parse(filteredArray[0].json));
          }
        } else {
          const filteredArray = response.data.filter(
            (item: ResultItem) => item.submittedBy === getEffectiveUserId()
          );
          if (filteredArray.length > 0) {
            const latestEntry = filteredArray.reduce(
              (latest: ResultItem, current: ResultItem) => {
                return new Date(current.createdAt) > new Date(latest.createdAt)
                  ? current
                  : latest;
              }
            );
            setResult(JSON.parse(latestEntry.json));
          }
        }
      }
    } catch (error) {
      Logger.error("Error getting results:", error);
    }
  };

  // FIXED: Load existing data when needed (prevent reloading after clear)
  useEffect(() => {
    if (loadExisting && surveyModel && !isClearing && !dataLoaded) {
      Logger.info("Loading existing data for resume/edit");
      
      // For resume requests, load progress data instead of results
      if (isResumeRequest) {
        loadAllProgressData(); // This will handle navigation too
      } else {
        getResults();
        setDataLoaded(true);
      }
    } else if (!loadExisting) {
      Logger.info("Starting with blank form");
      setDataLoaded(true);
    }
  }, [loadExisting, surveyModel, isClearing, dataLoaded, isResumeRequest]);

  // Load user and initial data
  useEffect(() => {
    getCurrentUser();
    getSurvey();
  }, []);

  // Apply theme
  useEffect(() => {
    if (surveyModel && selectedThemeIndex === 0) {
      const loadTheme = async () => {
        try {
          const response = await fetchData("/getTheme?surveyId=" + id, false);
          if (response.data && response.data.theme) {
            const parsedTheme = JSON.parse(response.data.theme);
            setTheme(parsedTheme);
            surveyModel.applyTheme(parsedTheme);
          }
        } catch (error) {
          Logger.debug("Theme loading failed or empty theme response:", error);
        }
      };
      loadTheme();
    }
  }, [surveyModel, selectedThemeIndex]);

  // FIXED: Apply result data to model (prevent reapplying after clear)
  useEffect(() => {
    if (Object.keys(result).length > 0 && loadExisting && surveyModel && !isCompleted && !isClearing && !isResumeRequest) {
      Logger.debug("Applying existing results to model");
      if (!result_id) {
        surveyModel.data = mergeDeep(surveyModel.data, result);
      } else {
        surveyModel.data = result;
      }
    }
  }, [result, surveyModel, result_id, loadExisting, isCompleted, isClearing, isResumeRequest]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showThemeDropdown && !target.closest('.theme-selector')) {
        setShowThemeDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showThemeDropdown]);

  // Theme Selector Component
  const ThemeSelector = () => (
    <div className="relative theme-selector">
      <button
        onClick={() => setShowThemeDropdown(!showThemeDropdown)}
        className="inline-flex items-center px-4 py-2 bg-white bg-opacity-20 text-white font-medium rounded-lg hover:bg-opacity-30 transition-colors duration-200"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z"></path>
        </svg>
        Themes
        <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </button>
      
      {showThemeDropdown && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-80 overflow-y-auto">
          <div className="py-2">
            <div className="px-4 py-2 text-sm font-semibold text-gray-700 border-b border-gray-200">
              Select Theme
            </div>
            {themeOptions.map((option, index) => (
              <button
                key={option.value}
                onClick={() => handleThemeChange(parseInt(option.value))}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors duration-150 ${
                  selectedThemeIndex === parseInt(option.value) 
                    ? 'bg-blue-50 text-blue-700 font-medium' 
                    : 'text-gray-700'
                }`}
              >
                {option.label}
                {selectedThemeIndex === parseInt(option.value) && (
                  <svg className="w-4 h-4 inline-block ml-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Progress Indicator Component
  const ProgressIndicator = () => {
    if (!surveyModel || surveyModel.pageCount <= 1 || !Array.isArray(pageProgress)) return null;

    const totalPages = surveyModel.pageCount;
    const currentPageIndex = surveyModel.currentPageNo;
    
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 no-print">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-700">Checklist Progress</h3>
          <span className="text-xs text-gray-500">
            {pageProgress.filter(p => p.isCompleted).length} of {totalPages} pages completed
          </span>
        </div>
        
        <div className="flex space-x-2">
          {Array.from({ length: totalPages }, (_, index) => {
            const isCompleted = pageProgress.some(p => p.pageIndex === index && p.isCompleted);
            const isCurrent = index === currentPageIndex;
            
            return (
              <div
                key={index}
                className={`flex-1 h-2 rounded-full ${
                  isCompleted 
                    ? 'bg-green-500' 
                    : isCurrent 
                      ? 'bg-blue-500' 
                      : 'bg-gray-200'
                }`}
                title={`Page ${index + 1} ${isCompleted ? '(Completed)' : isCurrent ? '(Current)' : ''}`}
              />
            );
          })}
        </div>
        
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>Page {currentPageIndex + 1} of {totalPages}</span>
          {isCurrentPageCompleted() && (
            <span className="text-green-600 font-medium">This page is completed</span>
          )}
        </div>
      </div>
    );
  };

  // Page Actions Component
  const PageActions = () => {
    if (!surveyModel || viewOnly || surveyModel.pageCount <= 1) return null;

    const canSubmitPage = surveyModel.currentPage.validate();
    const isCurrentCompleted = isCurrentPageCompleted();
    const isLastPage = surveyModel.currentPageNo === surveyModel.pageCount - 1;
    const allCompleted = areAllPagesCompleted();
    
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 no-print">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={startNewChecklist}
              className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
              </svg>
              New
            </button>
            
            {isResumeRequest && (
              <div className="flex items-center text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-md">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
                Resumed from In Flight
              </div>
            )}
            
            <button 
              onClick={debugAuthentication}
              className="px-3 py-1 bg-yellow-500 text-black text-xs rounded ml-2"
            >
              Debug Auth
            </button>
            
            <button 
              onClick={debugPageValidation}
              className="px-3 py-1 bg-red-500 text-white text-xs rounded ml-2"
            >
              Debug Page
            </button>
            
            {isAutoSaving && (
              <div className="flex items-center text-sm text-gray-500">
                <svg className="animate-spin h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
                  <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"></path>
                </svg>
                Auto-saving...
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            {!isCurrentCompleted && (
              <button
                onClick={submitCurrentPage}
                disabled={!canSubmitPage || isSubmittingPage}
                className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  canSubmitPage && !isSubmittingPage
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isSubmittingPage ? (
                  <>
                    <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
                      <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"></path>
                    </svg>
                    Submitting...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Submit Page
                  </>
                )}
              </button>
            )}
            
            {isLastPage && allCompleted && (
              <button
                onClick={() => surveyModel?.complete()}
                className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors duration-200"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                Complete Checklist
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Show loading state while checking authentication
  if (isLoadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loading />
          <p className="mt-4 text-gray-600">Loading user information...</p>
        </div>
      </div>
    );
  }

  // Render completion page if completed
  if (isCompleted && surveyModel) {
    return (
      <div className="min-h-screen theme-bg-primary">
        <header className="theme-bg-header shadow-lg no-print">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-8">
                <div className="flex items-center space-x-3">
                  <img src={navlogo} alt="UCT Logo" className="h-10 w-auto" />
                  <h1 className="text-xl font-semibold theme-text-white">Checklist Manager</h1>
                </div>
                <nav className="flex space-x-8">
                  <Link to="/" className="text-white hover:text-gray-300 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200">
                    My Checklists
                  </Link>
                  <Link to="/inflight" className="text-white hover:text-gray-300 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200">
                    In Flight Checklists
                  </Link>
                  <Link to="/about" className="text-white hover:text-gray-300 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200">
                    About
                  </Link>
                </nav>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-white text-sm">
                  {authenticatedUser?.isAuthenticated && (
                    <span className="inline-flex items-center px-2 py-1 bg-green-500 bg-opacity-20 rounded-md mr-2">
                      <svg className="w-3 h-3 text-green-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Authenticated
                    </span>
                  )}
                  {getDisplayName()}
                </span>
                <ThemeSelector />
              </div>
            </div>
          </div>
        </header>

        <div className="flex items-center justify-center min-h-screen p-8">
          <div className="bg-white rounded-lg p-8 text-center max-w-2xl w-full shadow-lg">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Checklist Completed Successfully!</h2>
            <p className="text-gray-600 mb-6">Your checklist has been completed successfully.</p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <button 
                className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200" 
                onClick={() => window.rerunSurvey()}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
                Run Checklist Again
              </button>
              <button 
                className={`inline-flex items-center px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors duration-200 ${isGeneratingPDF ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => window.generateUniversalPDF()}
                disabled={isGeneratingPDF}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                {isGeneratingPDF ? 'Generating...' : 'Download PDF'}
              </button>
              <button 
                className={`inline-flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200 ${isEmailingPDF ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => window.emailPDF()}
                disabled={isEmailingPDF}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                </svg>
                {isEmailingPDF ? 'Sending...' : 'Email PDF'}
              </button>
              <button 
                className={`inline-flex items-center px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors duration-200 ${isSavingToSharedFolder ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => window.saveToSharedFolder()}
                disabled={isSavingToSharedFolder}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4-1v8m0 0l-3-3m-3 3L9 8m-5 5h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H17M13 13h8m0 0V9m0 4l-3-3"></path>
                </svg>
                {isSavingToSharedFolder ? 'Saving...' : 'Save to Shared Folder'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return survey.json === "" || !surveyModel ? (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loading />
        <p className="mt-4 text-gray-600">Loading checklist...</p>
      </div>
    </div>
  ) : (
    <div className="min-h-screen theme-bg-primary">
      <header className="theme-bg-header shadow-lg no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-3">
                <img src={navlogo} alt="UCT Logo" className="h-10 w-auto" />
                <h1 className="text-xl font-semibold theme-text-white">Checklist Manager</h1>
              </div>
              <nav className="flex space-x-8">
                <Link to="/" className="text-white hover:text-gray-300 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200">
                  My Checklists
                </Link>
                <Link to="/inflight" className="text-white hover:text-gray-300 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200">
                  In Flight Checklists
                </Link>
                <Link to="/about" className="text-white hover:text-gray-300 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200">
                  About
                </Link>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-white text-sm">
                {authenticatedUser?.isAuthenticated && (
                  <span className="inline-flex items-center px-2 py-1 bg-green-500 bg-opacity-20 rounded-md mr-2">
                    <svg className="w-3 h-3 text-green-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Authenticated
                  </span>
                )}
                {getDisplayName()}
              </span>
              <ThemeSelector />
              
              <button 
                onClick={debugAuthentication}
                className="px-3 py-1 bg-yellow-500 text-black text-xs rounded"
              >
                Debug Auth
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <ProgressIndicator />
        <PageActions />
      </div>

      <div style={{ height: 'calc(100vh - 12rem)' }}>
        <Survey model={surveyModel} />
      </div>
    </div>
  );
};

export default Run;