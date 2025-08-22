// Updated Run.tsx - Original working code + Sequential Page Workflow
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
  showMetadata?: boolean; // Control whether to show the metadata section
}

// NEW: Interface for page progress tracking
interface PageProgress {
  pageIndex: number;
  pageData: any;
  completedBy: string;
  completedAt: string;
  isCompleted: boolean;
}

function initializeModelFromURL(search: string, modelData: any) {
  const queryParams = new URLSearchParams(search);
  const model = new Model(modelData);
  
  // Universal initialization - works with any survey structure
  const allQuestions = model.getAllQuestions();
  
  allQuestions.forEach((question) => {
    if (question.contentPanel) {
      // Handle panel questions
      queryParams.forEach((value, key) => {
        const subquestion = question.contentPanel.getQuestionByName(key);
        if (subquestion) {
          subquestion.value = value;
        }
      });
    } else {
      // Handle direct questions
      const paramValue = queryParams.get(question.name);
      if (paramValue) {
        question.value = paramValue;
      }
    }
  });

  return model;
}

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

// Simplified Universal PDF generation function
async function generateUniversalPDF(surveyModel: Model, userId: string, checklistName: string = 'Checklist') {
  try {
    Logger.info("🚀 Starting Universal PDF generation...");
    
    const PDF_SERVER_URL = process.env.REACT_APP_PDF_SERVER_URL || 'https://dc-analytics01.uct.local';
    
    // Get complete survey structure and data
    const surveyJson = surveyModel.toJSON();
    const surveyData = surveyModel.data;
    
    // Enhanced data collection - capture ALL survey data
    const enhancedSurveyData = { ...surveyData };
    
    // Get all questions and their values
    const allQuestions = surveyModel.getAllQuestions();
    allQuestions.forEach((question: any) => {
      const questionValue = question.value;
      if (questionValue !== undefined && questionValue !== null) {
        enhancedSurveyData[question.name] = questionValue;
      }
    });
    
    // Get plain data to ensure nothing is missed
    const plainData = surveyModel.getPlainData({ includeEmpty: false });
    plainData.forEach((item: any) => {
      if (item.name && item.value !== undefined && item.value !== null) {
        enhancedSurveyData[item.name] = item.value;
      }
    });
    
    // Add URL parameters as potential metadata
    const queryParams = new URLSearchParams(window.location.search);
    const urlMetadata: any = {};
    queryParams.forEach((value, key) => {
      urlMetadata[key] = value;
    });
    
    // Create metadata object - the Universal PDF Generator will extract what it needs
    const metadata: PDFMetadata = {
      title: surveyJson.title || checklistName || 'Checklist Results',
      systemName: 'Checklist Manager System',
      organizationName: 'UCT',
      logo: '',
      additionalInfo: `Generated for user: ${userId}`,
      showMetadata: true // Set to false to disable the metadata section completely
    };
    
    // Prepare request data for Universal PDF Generator
    const requestData = {
      surveyJson: surveyJson,
      surveyData: enhancedSurveyData,
      metadata: metadata,
      urlParams: urlMetadata, // Additional context
      fileName: `${checklistName.replace(/[^a-zA-Z0-9]/g, '_')}-${userId}-${new Date().toISOString().split('T')[0]}.pdf`
    };
    
    Logger.info("📤 Sending data to Universal PDF Generator:", {
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
    
    Logger.info("✅ Universal PDF downloaded successfully:", requestData.fileName);
    return true;
    
  } catch (error) {
    Logger.error("❌ Universal PDF generation failed:", error);
    throw error;
  }
}

// Email PDF function - simplified for universal use
async function emailPDF(surveyModel: Model, userId: string, checklistName: string = 'Checklist') {
  try {
    Logger.info("📧 Starting Email PDF...");
    
    const PDF_SERVER_URL = process.env.REACT_APP_PDF_SERVER_URL || 'https://dc-analytics01.uct.local';
    
    const surveyJson = surveyModel.toJSON();
    const surveyData = surveyModel.data;
    
    // Enhanced data collection
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
      showMetadata: true // Set to false to disable metadata section
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
      fileName: `${checklistName.replace(/[^a-zA-Z0-9]/g, '_')}-${userId}-${new Date().toISOString().split('T')[0]}.pdf`,
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
    Logger.info("✅ Email sent successfully:", result);
    window.alert(`PDF emailed successfully to ${recipientEmail}!`);
    
    return true;
    
  } catch (error) {
    Logger.error("❌ Email PDF failed:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    window.alert(`Email failed: ${errorMessage}`);
    throw error;
  }
}

async function saveToSharedFolder(surveyModel: Model, userId: string, checklistName: string = 'Checklist') {
  try {
    Logger.info("💾 Starting Save to Shared Folder...");
    
    const PDF_SERVER_URL = process.env.REACT_APP_PDF_SERVER_URL || 'https://dc-analytics01.uct.local';
    
    const surveyJson = surveyModel.toJSON();
    const surveyData = surveyModel.data;
    
    // Enhanced data collection
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
      showMetadata: true // Set to false to disable metadata section
    };
    
    const requestData = {
      surveyJson: surveyJson,
      surveyData: enhancedSurveyData,
      metadata: metadata,
      fileName: `${checklistName.replace(/[^a-zA-Z0-9]/g, '_')}-${userId}-${new Date().toISOString().split('T')[0]}.pdf`,
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
    Logger.info("✅ Shared folder save successful:", result);
    window.alert(`PDF saved successfully to shared folder: ${result.filePath || 'Success'}`);
    
    return true;
    
  } catch (error) {
    Logger.error("❌ Shared folder save failed:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    window.alert(`Shared folder save failed: ${errorMessage}`);
    throw error;
  }
}

// Enhanced fallback to window.print
function enhancedPrintFallback() {
  Logger.info("🖨️ Using enhanced print fallback");
  
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
  const userId: string = queryParams.get("inspectedby")
    ? queryParams.get("inspectedby")!
    : (queryParams.get("userid") ? queryParams.get("userid")! : "noname");

  result_id = queryParams.get("id") || result_id;
  let viewOnly = false;
  if (queryParams.get("view") === "1") {
    viewOnly = true;
  }

  // Check if we should load existing data
  const loadExisting = queryParams.get("load_existing") === "true" || 
                      result_id !== undefined || 
                      queryParams.get("edit") === "true";

  const { fetchData, postData } = useApi();
  const [survey, setSurvey] = useState({ json: "", name: " " });
  const [result, setResult] = useState({});
  const [theme, setTheme] = useState<ITheme>(themes[0]);
  const [surveyModel, setSurveyModel] = useState<Model | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isEmailingPDF, setIsEmailingPDF] = useState(false);
  const [isSavingToSharedFolder, setIsSavingToSharedFolder] = useState(false);
  
  // Add state to track completion and preserve survey data
  const [isCompleted, setIsCompleted] = useState(false);
  const [completedSurveyData, setCompletedSurveyData] = useState<any>(null);

  // Add theme selector state
  const [selectedThemeIndex, setSelectedThemeIndex] = useState<number>(0);
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);

  // NEW: Sequential page workflow states
  const [pageProgress, setPageProgress] = useState<PageProgress[]>([]);
  const [isSubmittingPage, setIsSubmittingPage] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);

  // NEW: Load progress data
  const loadProgress = async () => {
    try {
      const response = await fetchData(`/getProgress?postId=${id}`, false);
      setPageProgress(response || []);
      Logger.info("📊 Page progress loaded:", response?.length || 0, "pages");
    } catch (error) {
      Logger.debug("No existing progress found");
    }
  };

  // NEW: Auto-save current progress
  const autoSaveProgress = async (model: Model) => {
    if (isAutoSaving || userId === "noname") return;
    
    setIsAutoSaving(true);
    try {
      await postData("/saveProgress", {
        postId: id as string,
        currentData: model.data,
        currentPageNo: model.currentPageNo,
        userId: userId
      }, false);
      
      Logger.debug("💾 Auto-saved progress");
    } catch (error) {
      Logger.debug("Auto-save failed (this is normal for unauthenticated users)");
    } finally {
      setIsAutoSaving(false);
    }
  };

  // NEW: Submit current page
  const submitCurrentPage = async () => {
    if (!surveyModel || isSubmittingPage) return;
    
    if (userId === "noname") {
      alert("Please add ?userid=yourname to the URL to submit pages");
      return;
    }
    
    // Validate current page
    const currentPage = surveyModel.currentPage;
    if (!currentPage.validate()) {
      alert("Please complete all required fields on this page before submitting.");
      return;
    }
    
    setIsSubmittingPage(true);
    try {
      // Get page-specific data
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
        userId: userId
      }, false);
      
      // Reload progress to update UI
      await loadProgress();
      
      // Move to next page if available
      if (surveyModel.currentPageNo < surveyModel.pageCount - 1) {
        surveyModel.nextPage();
      }
      
      Logger.info("✅ Page submitted successfully");
      alert("Page submitted successfully!");
      
    } catch (error) {
      Logger.error("❌ Page submission failed:", error);
      alert("Failed to submit page. Please try again.");
    } finally {
      setIsSubmittingPage(false);
    }
  };

  // NEW: Check if current page is completed
  const isCurrentPageCompleted = () => {
    if (!surveyModel) return false;
    return pageProgress.some(p => p.pageIndex === surveyModel.currentPageNo && p.isCompleted);
  };

  // NEW: Check if all pages are completed
  const areAllPagesCompleted = () => {
    if (!surveyModel) return false;
    const totalPages = surveyModel.pageCount;
    const completedPages = pageProgress.filter(p => p.isCompleted).length;
    return completedPages === totalPages;
  };

  // Handle theme change
  const handleThemeChange = (themeIndex: number) => {
    const newTheme = themes[themeIndex];
    setTheme(newTheme);
    setSelectedThemeIndex(themeIndex);
    setShowThemeDropdown(false);
    
    if (surveyModel) {
      surveyModel.applyTheme(newTheme);
      Logger.info("🎨 Theme changed to:", themeOptions.find(opt => opt.value === themeIndex.toString())?.label);
    }
  };

  // Initialize model when survey data is available
  useEffect(() => {
    if (survey.json) {
      const model = initializeModelFromURL(window.location.search, survey.json);
      
      Logger.info("🔧 Model Initialized with Universal PDF Generator support");
      Logger.info("📊 Survey details:", {
        questions: model.getAllQuestions().length,
        pages: model.pages.length,
        title: model.title,
        loadExisting
      });
      
      // NEW: Setup auto-save on data change
      model.onValueChanged.add((sender) => {
        autoSaveProgress(sender);
      });

      // NEW: Setup page change handler
      model.onCurrentPageChanged.add((sender) => {
        autoSaveProgress(sender);
      });
      
      // Set up rerun function
      const rerunSurvey = () => {
        Logger.info("🔄 Rerunning survey");
        setIsCompleted(false);
        setCompletedSurveyData(null);
        model.clear(false);
        model.mode = "edit";
      };
      window.rerunSurvey = rerunSurvey;

      // Set up Universal PDF generation function
      const generateUniversalPDFWrapper = async () => {
        if (isGeneratingPDF) {
          Logger.warn("⚠️ PDF generation already in progress");
          return;
        }
        
        setIsGeneratingPDF(true);
        
        try {
          // Use completed survey data if available, otherwise use current model data
          const dataToUse = completedSurveyData || model.data;
          const hasData = dataToUse && Object.keys(dataToUse).length > 0;
          
          if (!hasData) {
            Logger.warn("⚠️ Checklist has no data - generating PDF with empty responses");
          }
          
          // Create a temporary model copy with the data for PDF generation
          const tempModel = new Model(model.toJSON());
          tempModel.data = dataToUse;
          
          await generateUniversalPDF(tempModel, userId, survey.name || 'Checklist');
          
        } catch (error) {
          Logger.error("❌ Universal PDF generation failed:", error);
          
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
          
          await emailPDF(tempModel, userId, survey.name || 'Checklist');
        } catch (error) {
          Logger.error("❌ Email PDF failed:", error);
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
          
          await saveToSharedFolder(tempModel, userId, survey.name || 'Checklist');
        } catch (error) {
          Logger.error("❌ Shared folder save failed:", error);
        } finally {
          setIsSavingToSharedFolder(false);
        }
      };
      window.saveToSharedFolder = saveToSharedFolderWrapper;

      // Configure serialization
      Serializer.getProperty("survey", "clearInvisibleValues").defaultValue = "none";

      // Set up completion handler with improved UI
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
        Logger.debug("📋 Checklist completed:", {
          dataKeys: Object.keys(sender.data),
          questionCount: sender.getAllQuestions().length
        });
        
        // Save the completed survey data
        setCompletedSurveyData({ ...sender.data });
        setIsCompleted(true);
        
        // Post data to server
        await postData(
          "/post",
          {
            postId: id as string,
            surveyResult: sender.data,
            userId: userId,
            createdAt: new Date().toISOString(),
          },
          false
        );
        
        Logger.info("✅ Checklist completed and data preserved");
      });

      setSurveyModel(model);
    }
  }, [survey.json, id, userId, viewOnly, postData, isGeneratingPDF, isEmailingPDF, isSavingToSharedFolder, loadExisting]);

  // Get survey data
  const getSurvey = async () => {
    try {
      const response = await fetchData("/getSurvey?surveyId=" + id, false);
      Logger.info("📋 Checklist data received:", {
        title: response.data.name,
        hasJson: !!response.data.json
      });
      setSurvey(response.data);
    } catch (error) {
      Logger.error("❌ Error getting checklist:", error);
    }
  };

  // Get existing results
  const getResults = async () => {
    try {
      const response = await fetchData("/results?postId=" + id, false);
      Logger.debug("📊 Results received:", response.data.length, "items");

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
            (item: ResultItem) => item.submittedBy === userId
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
      Logger.error("❌ Error getting results:", error);
    }
  };

  // Load existing data when needed
  useEffect(() => {
    if (loadExisting && surveyModel) {
      Logger.info("📥 Loading existing data");
      getResults();
    } else {
      Logger.info("📝 Starting with blank form");
    }
  }, [loadExisting, surveyModel]);

  // MODIFIED: Load survey and progress data
  useEffect(() => {
    getSurvey();
    loadProgress(); // NEW: Load progress data
  }, []);

  // NEW: Apply existing progress to model
  useEffect(() => {
    if (surveyModel && pageProgress.length > 0) {
      // Merge all completed page data
      let mergedData = {};
      pageProgress.forEach(progress => {
        if (progress.isCompleted && progress.pageData) {
          mergedData = { ...mergedData, ...progress.pageData };
        }
      });
      
      if (Object.keys(mergedData).length > 0) {
        surveyModel.data = mergeDeep(surveyModel.data, mergedData);
        Logger.info("📥 Applied existing progress:", Object.keys(mergedData).length, "fields");
      }
    }
  }, [surveyModel, pageProgress]);

  // Apply theme (but don't override manual theme selection)
  useEffect(() => {
    if (surveyModel && selectedThemeIndex === 0) { // Only apply server theme if user hasn't manually selected one
      const loadTheme = async () => {
        try {
          const response = await fetchData("/getTheme?surveyId=" + id, false);
          if (response.data && response.data.theme) {
            const parsedTheme = JSON.parse(response.data.theme);
            setTheme(parsedTheme);
            surveyModel.applyTheme(parsedTheme);
          }
        } catch (error) {
          Logger.error("❌ Error getting theme:", error);
        }
      };
      loadTheme();
    }
  }, [surveyModel, selectedThemeIndex]);

  // Apply result data to model
  useEffect(() => {
    if (Object.keys(result).length > 0 && loadExisting && surveyModel && !isCompleted) {
      Logger.debug("📊 Applying existing results to model");
      if (!result_id) {
        surveyModel.data = mergeDeep(surveyModel.data, result);
      } else {
        surveyModel.data = result;
      }
    }
  }, [result, surveyModel, result_id, loadExisting, isCompleted]);

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

  // NEW: Progress Indicator Component
  const ProgressIndicator = () => {
    if (!surveyModel || surveyModel.pageCount <= 1) return null;

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
            <span className="text-green-600 font-medium">✓ This page is completed</span>
          )}
        </div>
      </div>
    );
  };

  // NEW: Page Actions Component
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
                  <Link to="/about" className="text-white hover:text-gray-300 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200">
                    About
                  </Link>
                </nav>
              </div>
              <div className="flex items-center space-x-4">
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
                className={`inline-flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-colors duration-200 ${isEmailingPDF ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4-1v8m0 0l3-3m-3 3L9 8m-5 5h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H17M13 13h8m0 0V9m0 4l-3-3"></path>
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
                <Link to="/about" className="text-white hover:text-gray-300 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200">
                  About
                </Link>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-white text-sm">User: {userId}</span>
              <ThemeSelector />
            </div>
          </div>
        </div>
      </header>

      {/* NEW: Progress and Actions sections */}
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