// src/pages/Run.tsx - Updated to launch blank forms by default
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
import { themes } from "../utils/themeOptions";
import Logger from "../utils/logger";
import Loading from "../components/Loading";
import { FaFilePdf, FaSpinner, FaEnvelope, FaShareAlt } from 'react-icons/fa';
import navlogo from "../OneUCT_Logo.png";

// Global window interface
declare global {
  interface Window {
    rerunSurvey: () => void;
    generateUniversalPDF: () => Promise<void>;
    emailPDF: () => Promise<void>;
    saveToSharePoint: () => Promise<void>;
  }
}

// SurveyJS matrix dropdown extensions and signature support
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
  fields: Array<{
    label: string;
    value: string;
  }>;
  additionalInfo?: string;
}

function initializeModelFromURL(search: string, modelData: any) {
  const queryParams = new URLSearchParams(search);
  const model = new Model(modelData);
  const questionsToInitialize = [
    "datacollection_header",
    "checklist_header_fi",
    "checklist_header_shipkit",
    "checklist_content_fi",
    "universal_header",
    "universal_content",
  ];

  const questions = model.getAllQuestions();
  const filteredQuestions = questions.filter((question) => {
    return questionsToInitialize.some((prefix) =>
      question.name.startsWith(prefix)
    );
  });

  filteredQuestions.forEach((question) => {
    Logger.info("initializeModelFromURL: question ", question);
    if (question) {
      queryParams.forEach((value, key) => {
        Logger.info("query parameters, key, value:", key, value);
        const subquestion = question.contentPanel.getQuestionByName(key);
        if (subquestion) {
          subquestion.value = value;
        } else {
          Logger.warn(`Subquestion named ${key} not found in ${question.name}`);
        }
      });
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

// Universal PDF generation function
async function generateUniversalPDF(surveyModel: Model, userId: string, surveyName: string = 'Survey') {
  try {
    Logger.info("Starting Universal PDF generation...");
    
    const PDF_SERVER_URL = process.env.REACT_APP_PDF_SERVER_URL || 'http://DC-ANALYTICS01:3001';
    
    const surveyJson = surveyModel.toJSON();
    const surveyData = surveyModel.data;
    
    const metadata: PDFMetadata = {
      title: surveyJson.title || surveyName || 'Survey Results',
      systemName: 'Checklist Manager System',
      organizationName: 'UCT',
      logo: '',
      fields: [],
      additionalInfo: ''
    };
    
    const requestData = {
      surveyJson: surveyJson,
      surveyData: surveyData,
      metadata: metadata,
      fileName: `${surveyName.replace(/[^a-zA-Z0-9]/g, '_')}-${userId}-${new Date().toISOString().split('T')[0]}.pdf`
    };
    
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
async function emailPDF(surveyModel: Model, userId: string, surveyName: string = 'Survey') {
  try {
    Logger.info("Starting Email PDF...");
    
    const PDF_SERVER_URL = process.env.REACT_APP_PDF_SERVER_URL || 'http://DC-ANALYTICS01:3001';
    
    const surveyJson = surveyModel.toJSON();
    const surveyData = surveyModel.data;
    
    const metadata: PDFMetadata = {
      title: surveyJson.title || surveyName || 'Survey Results',
      systemName: 'Checklist Manager System',
      organizationName: 'UCT',
      logo: '',
      fields: [],
      additionalInfo: ''
    };
    
    // Get recipient email from user input
    const recipientEmail = window.prompt('Enter recipient email address:');
    if (!recipientEmail) {
      Logger.info("Email cancelled by user");
      return;
    }
    
    const requestData = {
      surveyJson: surveyJson,
      surveyData: surveyData,
      metadata: metadata,
      fileName: `${surveyName.replace(/[^a-zA-Z0-9]/g, '_')}-${userId}-${new Date().toISOString().split('T')[0]}.pdf`,
      recipientEmail: recipientEmail,
      senderName: userId,
      subject: `Inspection Report: ${surveyName}`
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

// Save to SharePoint function
async function saveToSharePoint(surveyModel: Model, userId: string, surveyName: string = 'Survey') {
  try {
    Logger.info("Starting Save to SharePoint...");
    
    const PDF_SERVER_URL = process.env.REACT_APP_PDF_SERVER_URL || 'http://DC-ANALYTICS01:3001';
    
    const surveyJson = surveyModel.toJSON();
    const surveyData = surveyModel.data;
    
    const metadata: PDFMetadata = {
      title: surveyJson.title || surveyName || 'Survey Results',
      systemName: 'Checklist Manager System',
      organizationName: 'UCT',
      logo: '',
      fields: [],
      additionalInfo: ''
    };
    
    const requestData = {
      surveyJson: surveyJson,
      surveyData: surveyData,
      metadata: metadata,
      fileName: `${surveyName.replace(/[^a-zA-Z0-9]/g, '_')}-${userId}-${new Date().toISOString().split('T')[0]}.pdf`,
      userId: userId,
      folderPath: '/Shared Documents/Inspection Reports'
    };
    
    const response = await fetch(`${PDF_SERVER_URL}/save-to-sharepoint`, {
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
      Logger.error("SharePoint save server response error:", errorData);
      throw new Error(`SharePoint save failed: ${errorData.error || 'Unknown error'}`);
    }
    
    const result = await response.json();
    Logger.info("SharePoint save successful:", result);
    window.alert(`PDF saved successfully to SharePoint: ${result.sharePointUrl || 'Success'}`);
    
    return true;
    
  } catch (error) {
    Logger.error("SharePoint save failed:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    window.alert(`SharePoint save failed: ${errorMessage}`);
    throw error;
  }
}

// Enhanced fallback to window.print with better styling
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
        
        .sv_qstn {
          margin-bottom: 15px !important;
          page-break-inside: avoid !important;
        }
        
        .sv_q_title {
          font-weight: bold !important;
          margin-bottom: 8px !important;
          color: #000 !important;
        }
        
        .sv_q_input,
        .sv_q_text_root,
        .sv_q_textarea,
        .sv_q_dropdown,
        .sv_q_checkbox,
        .sv_q_radiogroup {
          margin-bottom: 10px !important;
        }
        
        img {
          max-width: 100% !important;
          height: auto !important;
          -webkit-print-color-adjust: exact !important;
        }
        
        table {
          border-collapse: collapse !important;
          width: 100% !important;
          margin-bottom: 15px !important;
        }
        
        th, td {
          border: 1px solid #000 !important;
          padding: 6px !important;
          text-align: left !important;
          font-size: 11px !important;
        }
        
        th {
          background-color: #f0f0f0 !important;
          font-weight: bold !important;
        }
        
        .sv_page {
          page-break-before: auto !important;
          page-break-after: auto !important;
        }
        
        .sv_p_container,
        .sv_panel {
          border: 1px solid #ddd !important;
          margin-bottom: 15px !important;
          padding: 10px !important;
        }
        
        .sv_p_title {
          font-weight: bold !important;
          font-size: 14px !important;
          margin-bottom: 10px !important;
          border-bottom: 1px solid #ccc !important;
          padding-bottom: 5px !important;
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
  
  window.alert('Using browser print dialog. Please select "Save as PDF" or "Print to PDF" when the dialog opens.');
  
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
  Logger.info("Run state: result_id", result_id);

  const queryParams = new URLSearchParams(window.location.search);
  const userId: string = queryParams.get("inspectedby")
    ? queryParams.get("inspectedby")!
    : (queryParams.get("userid") ? queryParams.get("userid")! : "noname");

  result_id = queryParams.get("id") || result_id;
  let viewOnly = false;
  if (queryParams.get("view") === "1") {
    viewOnly = true;
  }

  // NEW: Check if we should load existing data
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
  const [isSavingToSharePoint, setIsSavingToSharePoint] = useState(false);

  // Initialize model when survey data is available
  useEffect(() => {
    if (survey.json) {
      const model = initializeModelFromURL(window.location.search, survey.json);
      
      Logger.info("=== Model Initialized ===");
      Logger.info("Model getAllQuestions():", model.getAllQuestions().length);
      Logger.info("Load existing data:", loadExisting);
      
      // Set up rerun function
      const rerunSurvey = () => {
        model.clear(false);
      };
      window.rerunSurvey = rerunSurvey;

      // Set up Universal PDF generation function
      const generateUniversalPDFWrapper = async () => {
        if (isGeneratingPDF) {
          Logger.warn("PDF generation already in progress");
          return;
        }
        
        setIsGeneratingPDF(true);
        
        try {
          const hasData = model.data && Object.keys(model.data).length > 0;
          Logger.info("Model has data:", hasData);
          
          if (!hasData) {
            Logger.warn("Survey has no data - generating PDF with empty responses");
          }
          
          await generateUniversalPDF(model, userId, survey.name || 'Survey');
          
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
        if (isEmailingPDF) {
          Logger.warn("Email PDF already in progress");
          return;
        }
        
        setIsEmailingPDF(true);
        
        try {
          await emailPDF(model, userId, survey.name || 'Survey');
        } catch (error) {
          Logger.error("Email PDF failed:", error);
        } finally {
          setIsEmailingPDF(false);
        }
      };
      window.emailPDF = emailPDFWrapper;

      // Set up Save to SharePoint function
      const saveToSharePointWrapper = async () => {
        if (isSavingToSharePoint) {
          Logger.warn("SharePoint save already in progress");
          return;
        }
        
        setIsSavingToSharePoint(true);
        
        try {
          await saveToSharePoint(model, userId, survey.name || 'Survey');
        } catch (error) {
          Logger.error("SharePoint save failed:", error);
        } finally {
          setIsSavingToSharePoint(false);
        }
      };
      window.saveToSharePoint = saveToSharePointWrapper;

      // Configure serialization
      Serializer.getProperty("survey", "clearInvisibleValues").defaultValue = "none";

      // Set up completion handler with PDF download option
      model.completedHtml = `
        <div class="bg-white rounded-lg p-8 text-center">
          <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h2 class="text-2xl font-bold text-gray-900 mb-2">Thank you for your work!</h2>
          <p class="text-gray-600 mb-6">Your checklist has been completed successfully.</p>
          
          <div class="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <button class="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200" onclick="window.rerunSurvey()">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
              Run Survey Again
            </button>
            <button class="inline-flex items-center px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors duration-200" onclick="window.generateUniversalPDF()">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              Download PDF
            </button>
            <button class="inline-flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200" onclick="window.emailPDF()">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
              </svg>
              Email PDF
            </button>
            <button class="inline-flex items-center px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors duration-200" onclick="window.saveToSharePoint()">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"></path>
              </svg>
              Save to SharePoint
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
        Logger.debug("onComplete Survey data:", sender.data);
        
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
      });

      setSurveyModel(model);
    }
  }, [survey.json, id, userId, viewOnly, postData, isGeneratingPDF, isEmailingPDF, isSavingToSharePoint, loadExisting]);

  const getSurvey = async () => {
    try {
      const response = await fetchData("/getSurvey?surveyId=" + id, false);
      Logger.info("Survey data received:", response.data);
      setSurvey(response.data);
    } catch (error) {
      Logger.error("Error getting survey:", error);
    }
  };

  const getResults = async () => {
    try {
      const response = await fetchData("/results?postId=" + id, false);
      Logger.debug("Run getResults: ", response.data);

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
      Logger.error("Error getting results:", error);
    }
  };

  // UPDATED: Only load existing data when specifically requested
  const shouldGetResults = loadExisting && surveyModel && (!surveyModel
    .getAllQuestions()
    .some((question) => question.name === "datacollection_header") || result_id);

  useEffect(() => {
    if (shouldGetResults) {
      Logger.info("Loading existing data based on query parameters");
      getResults();
    } else {
      Logger.info("Starting with blank form - no existing data loaded");
    }
  }, [result_id, shouldGetResults]);

  useEffect(() => {
    getSurvey();
  }, []);

  useEffect(() => {
    if (surveyModel) {
      // Load and apply theme when model is ready
      const loadTheme = async () => {
        try {
          const response = await fetchData("/getTheme?surveyId=" + id, false);
          if (response.data && response.data.theme) {
            const parsedTheme = JSON.parse(response.data.theme);
            setTheme(parsedTheme);
            surveyModel.applyTheme(parsedTheme);
          }
        } catch (error) {
          Logger.error("Error getting theme:", error);
        }
      };
      loadTheme();
    }
  }, [surveyModel]);

  // Apply result data to model ONLY when we should load existing data
  useEffect(() => {
    if (Object.keys(result).length > 0 && shouldGetResults && surveyModel) {
      Logger.debug("Run: applying result data to model", result);
      if (!result_id) {
        surveyModel.data = mergeDeep(surveyModel.data, result);
      } else {
        surveyModel.data = result;
      }
    }
  }, [result, surveyModel, result_id, shouldGetResults]);

  return survey.json === "" || !surveyModel ? (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loading />
        <p className="mt-4 text-gray-600">Loading checklist...</p>
      </div>
    </div>
  ) : (
    <div className="min-h-screen theme-bg-primary">
      {/* Navigation Header */}
      <header className="theme-bg-header shadow-lg no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left side - Logo and Navigation */}
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-3">
                {/* UCT Logo */}
                <div className="flex items-center">
                  <img
                    src={navlogo}
                    alt="UCT Logo"
                    className="h-10 w-auto"
                  />
                </div>
                <h1 className="text-xl font-semibold theme-text-white">Checklist Manager</h1>
              </div>
              
              {/* Navigation Menu */}
              <nav className="flex space-x-8">
                <Link 
                  to="/" 
                  className="text-white hover:text-gray-300 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  My Checklists
                </Link>
                <Link 
                  to="/about" 
                  className="text-white hover:text-gray-300 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  About
                </Link>
              </nav>
            </div>

            {/* Right side - Status indicator */}
            <div className="text-white text-sm">
              {loadExisting ? 
                `📄 Loaded existing data` : 
                `📝 Blank form`
              }
            </div>
          </div>
        </div>
      </header>

      {/* Survey Content */}
      <div style={{ height: 'calc(100vh - 4rem)' }}>
        <Survey model={surveyModel} />
      </div>
    </div>
  );
};

export default Run;