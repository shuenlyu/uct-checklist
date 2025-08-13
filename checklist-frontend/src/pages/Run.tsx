// src/pages/Run.tsx - Fixed to prevent page refresh on PDF download
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
    saveToSharedFolder: () => Promise<void>;
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
    
    const PDF_SERVER_URL = process.env.REACT_APP_PDF_SERVER_URL || 'https://dc-analytics01.uct.local';
    
    const surveyJson = surveyModel.toJSON();
    const surveyData = surveyModel.data;
    
    // Enhanced data collection - capture all question values
    const enhancedSurveyData = { ...surveyData };
    
    const allQuestions = surveyModel.getAllQuestions();
    allQuestions.forEach((question: any) => {
      const questionValue = question.value;
      if (questionValue !== undefined && questionValue !== null) {
        enhancedSurveyData[question.name] = questionValue;
      }
    });
    
    // Also include plain data to ensure nothing is missed
    const plainData = surveyModel.getPlainData({ includeEmpty: false });
    plainData.forEach((item: any) => {
      if (item.name && item.value !== undefined && item.value !== null) {
        enhancedSurveyData[item.name] = item.value;
      }
    });
    
    // Extract header fields
    const headerFields = extractHeaderFields(enhancedSurveyData, surveyJson);
    
    const metadata: PDFMetadata = {
      title: surveyJson.title || surveyName || 'Survey Results',
      systemName: 'Checklist Manager System',
      organizationName: 'UCT',
      logo: '',
      fields: headerFields,
      additionalInfo: ''
    };
    
    const requestData = {
      surveyJson: surveyJson,
      surveyData: enhancedSurveyData,
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

// Function to extract header fields from survey data
function extractHeaderFields(surveyData: any, surveyJson: any): Array<{label: string, value: string, required?: boolean}> {
  const headerFields: Array<{label: string, value: string, required?: boolean}> = [];
  
  if (!surveyData) {
    Logger.warn("No survey data available for header extraction");
    return headerFields;
  }
  
  Logger.info("Extracting header fields from survey data:", surveyData);
  
  // Strategy 1: Look for common header field patterns in survey data
  const commonHeaderMappings = [
    { key: 'station', label: 'Station', required: true },
    { key: 'wo', label: 'Work Order', required: true },
    { key: 'workorder', label: 'Work Order', required: true },
    { key: 'toolid', label: 'Tool ID', required: true },
    { key: 'tool_id', label: 'Tool ID', required: true },
    { key: 'date', label: 'Date', required: true },
    { key: 'inspector', label: 'Inspector', required: false },
    { key: 'inspectedby', label: 'Inspected By', required: false },
    { key: 'checkedby', label: 'Checked By', required: false },
    { key: 'operator', label: 'Operator', required: false },
    { key: 'shift', label: 'Shift', required: false },
    { key: 'line', label: 'Line', required: false }
  ];
  
  // Strategy 2: Look for header data in nested objects (like panel data)
  for (const [dataKey, dataValue] of Object.entries(surveyData)) {
    Logger.info(`Checking data key: ${dataKey}`, dataValue);
    
    // Check if this key contains header-like data
    if (typeof dataValue === 'object' && dataValue !== null && !Array.isArray(dataValue)) {
      // Check for common header field names in this object
      for (const mapping of commonHeaderMappings) {
        const fieldValue = (dataValue as any)[mapping.key];
        if (fieldValue !== undefined && fieldValue !== null && fieldValue !== '') {
          const stringValue = typeof fieldValue === 'string' ? fieldValue : String(fieldValue);
          
          // Avoid duplicates
          if (!headerFields.some(field => field.label === mapping.label)) {
            headerFields.push({
              label: mapping.label,
              value: stringValue,
              required: mapping.required
            });
            Logger.info(`Found header field: ${mapping.label} = ${stringValue}`);
          }
        }
      }
    }
    
    // Also check top-level keys
    for (const mapping of commonHeaderMappings) {
      if (dataKey.toLowerCase() === mapping.key.toLowerCase()) {
        const stringValue = typeof dataValue === 'string' ? dataValue : String(dataValue);
        if (stringValue && stringValue !== 'null' && stringValue !== 'undefined') {
          // Avoid duplicates
          if (!headerFields.some(field => field.label === mapping.label)) {
            headerFields.push({
              label: mapping.label,
              value: stringValue,
              required: mapping.required
            });
            Logger.info(`Found top-level header field: ${mapping.label} = ${stringValue}`);
          }
        }
      }
    }
  }
  
  // Strategy 3: Look for specific patterns in survey JSON structure
  if (surveyJson && surveyJson.pages) {
    for (const page of surveyJson.pages) {
      if (page.elements) {
        for (const element of page.elements) {
          // Check for header panels
          if (element.type === 'panel' && 
              (element.name?.toLowerCase().includes('header') || 
               element.title?.toLowerCase().includes('header'))) {
            
            Logger.info("Found header panel:", element.name);
            
            // Extract field definitions from panel elements
            if (element.elements) {
              for (const panelElement of element.elements) {
                const elementName = panelElement.name?.toLowerCase() || '';
                const elementTitle = panelElement.title || panelElement.name || '';
                
                // Look for matching data
                const dataValue = surveyData[element.name]?.[panelElement.name] || 
                                surveyData[panelElement.name];
                
                if (dataValue !== undefined && dataValue !== null && dataValue !== '') {
                  const stringValue = typeof dataValue === 'string' ? dataValue : String(dataValue);
                  
                  // Avoid duplicates
                  if (!headerFields.some(field => field.label === elementTitle)) {
                    headerFields.push({
                      label: elementTitle,
                      value: stringValue,
                      required: panelElement.isRequired || false
                    });
                    Logger.info(`Found panel header field: ${elementTitle} = ${stringValue}`);
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  
  // Strategy 4: If no specific headers found, use some default fields from query params
  if (headerFields.length === 0) {
    const queryParams = new URLSearchParams(window.location.search);
    const defaultMappings = [
      { param: 'station', label: 'Station' },
      { param: 'wo', label: 'Work Order' },
      { param: 'toolid', label: 'Tool ID' },
      { param: 'inspectedby', label: 'Inspector' }
    ];
    
    for (const mapping of defaultMappings) {
      const value = queryParams.get(mapping.param);
      if (value) {
        headerFields.push({
          label: mapping.label,
          value: value,
          required: true
        });
      }
    }
  }
  
  // Add current date if no date field found
  if (!headerFields.some(field => field.label.toLowerCase().includes('date'))) {
    headerFields.push({
      label: 'Date',
      value: new Date().toLocaleString(),
      required: false
    });
  }
  
  Logger.info("Final extracted header fields:", headerFields);
  return headerFields;
}

// Email PDF function
async function emailPDF(surveyModel: Model, userId: string, surveyName: string = 'Survey') {
  try {
    Logger.info("Starting Email PDF...");
    
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
    
    const headerFields = extractHeaderFields(enhancedSurveyData, surveyJson);
    
    const metadata: PDFMetadata = {
      title: surveyJson.title || surveyName || 'Survey Results',
      systemName: 'Checklist Manager System',
      organizationName: 'UCT',
      logo: '',
      fields: headerFields,
      additionalInfo: ''
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

async function saveToSharedFolder(surveyModel: Model, userId: string, surveyName: string = 'Survey') {
  try {
    Logger.info("Starting Save to Shared Folder...");
    
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
    
    const headerFields = extractHeaderFields(enhancedSurveyData, surveyJson);
    
    const metadata: PDFMetadata = {
      title: surveyJson.title || surveyName || 'Survey Results',
      systemName: 'Checklist Manager System',
      organizationName: 'UCT',
      logo: '',
      fields: headerFields,
      additionalInfo: ''
    };
    
    const requestData = {
      surveyJson: surveyJson,
      surveyData: enhancedSurveyData,
      metadata: metadata,
      fileName: `${surveyName.replace(/[^a-zA-Z0-9]/g, '_')}-${userId}-${new Date().toISOString().split('T')[0]}.pdf`,
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
  
  // NEW: Add state to track completion and preserve survey data
  const [isCompleted, setIsCompleted] = useState(false);
  const [completedSurveyData, setCompletedSurveyData] = useState<any>(null);

  // Initialize model when survey data is available
  useEffect(() => {
    if (survey.json) {
      const model = initializeModelFromURL(window.location.search, survey.json);
      
      Logger.info("=== Model Initialized ===");
      Logger.info("Model getAllQuestions():", model.getAllQuestions().length);
      Logger.info("Load existing data:", loadExisting);
      
      // Set up rerun function - ONLY clear completion state, not the entire model
      const rerunSurvey = () => {
        Logger.info("Rerunning survey - clearing completion state");
        setIsCompleted(false);
        setCompletedSurveyData(null);
        model.clear(false);
        // Force re-render by resetting the model state
        model.mode = "edit";
      };
      window.rerunSurvey = rerunSurvey;

      // Set up Universal PDF generation function - PRESERVE completion state
      const generateUniversalPDFWrapper = async () => {
        if (isGeneratingPDF) {
          Logger.warn("PDF generation already in progress");
          return;
        }
        
        setIsGeneratingPDF(true);
        
        try {
          // Use completed survey data if available, otherwise use current model data
          const dataToUse = completedSurveyData || model.data;
          const hasData = dataToUse && Object.keys(dataToUse).length > 0;
          Logger.info("Model has data:", hasData);
          
          if (!hasData) {
            Logger.warn("Survey has no data - generating PDF with empty responses");
          }
          
          // Create a temporary model copy with the data for PDF generation
          const tempModel = new Model(model.toJSON());
          tempModel.data = dataToUse;
          
          await generateUniversalPDF(tempModel, userId, survey.name || 'Survey');
          
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

      // Set up Email PDF function - PRESERVE completion state
      const emailPDFWrapper = async () => {
        if (isEmailingPDF) {
          Logger.warn("Email PDF already in progress");
          return;
        }
        
        setIsEmailingPDF(true);
        
        try {
          // Use completed survey data if available
          const dataToUse = completedSurveyData || model.data;
          const tempModel = new Model(model.toJSON());
          tempModel.data = dataToUse;
          
          await emailPDF(tempModel, userId, survey.name || 'Survey');
        } catch (error) {
          Logger.error("Email PDF failed:", error);
        } finally {
          setIsEmailingPDF(false);
        }
      };
      window.emailPDF = emailPDFWrapper;

      // Set up Save to Shared Folder function - PRESERVE completion state
      const saveToSharedFolderWrapper = async () => {
        if (isSavingToSharedFolder) {
          Logger.warn("Shared folder save already in progress");
          return;
        }
        
        setIsSavingToSharedFolder(true);
        
        try {
          // Use completed survey data if available
          const dataToUse = completedSurveyData || model.data;
          const tempModel = new Model(model.toJSON());
          tempModel.data = dataToUse;
          
          await saveToSharedFolder(tempModel, userId, survey.name || 'Survey');
        } catch (error) {
          Logger.error("Shared folder save failed:", error);
        } finally {
          setIsSavingToSharedFolder(false);
        }
      };
      window.saveToSharedFolder = saveToSharedFolderWrapper;

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
            <button class="inline-flex items-center px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors duration-200 ${isGeneratingPDF ? 'opacity-50 cursor-not-allowed' : ''}" onclick="window.generateUniversalPDF()" ${isGeneratingPDF ? 'disabled' : ''}>
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              ${isGeneratingPDF ? 'Generating...' : 'Download PDF'}
            </button>
            <button class="inline-flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200 ${isEmailingPDF ? 'opacity-50 cursor-not-allowed' : ''}" onclick="window.emailPDF()" ${isEmailingPDF ? 'disabled' : ''}>
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
              </svg>
              ${isEmailingPDF ? 'Sending...' : 'Email PDF'}
            </button>
            <button class="inline-flex items-center px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors duration-200 ${isSavingToSharedFolder ? 'opacity-50 cursor-not-allowed' : ''}" onclick="window.saveToSharedFolder()" ${isSavingToSharedFolder ? 'disabled' : ''}>
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4-1v8m0 0l3-3m-3 3L9 8m-5 5h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H17M13 13h8m0 0V9m0 4l-3-3"></path>
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

      // Set up completion handler - PRESERVE survey data and set completion state
      model.onComplete.add(async (sender: Model) => {
        Logger.debug("onComplete Survey data:", sender.data);
        
        // Save the completed survey data to prevent loss
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
        
        Logger.info("Survey completed and data preserved");
      });

      setSurveyModel(model);
    }
  }, [survey.json, id, userId, viewOnly, postData, isGeneratingPDF, isEmailingPDF, isSavingToSharedFolder, loadExisting]);

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

  // Only load existing data when specifically requested
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
    if (Object.keys(result).length > 0 && shouldGetResults && surveyModel && !isCompleted) {
      Logger.debug("Run: applying result data to model", result);
      if (!result_id) {
        surveyModel.data = mergeDeep(surveyModel.data, result);
      } else {
        surveyModel.data = result;
      }
    }
  }, [result, surveyModel, result_id, shouldGetResults, isCompleted]);

  // NEW: Render completion page manually if completed
  if (isCompleted && surveyModel) {
    return (
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
                ✅ Survey Completed
              </div>
            </div>
          </div>
        </header>

        {/* Completion Content */}
        <div className="flex items-center justify-center min-h-screen p-8">
          <div className="bg-white rounded-lg p-8 text-center max-w-2xl w-full shadow-lg">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank you for your work!</h2>
            <p className="text-gray-600 mb-6">Your checklist has been completed successfully.</p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <button 
                className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200" 
                onClick={() => window.rerunSurvey()}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
                Run Survey Again
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