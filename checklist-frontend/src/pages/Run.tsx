// src/pages/Run.tsx - Enhanced Print Styling for Professional PDF Output
import { useParams } from "react-router";
import {
  ITheme,
  matrixDropdownColumnTypes,
  Model,
  Serializer,
} from "survey-core";

import { useEffect, useState } from "react";
import "survey-core/defaultV2.css";
import { Survey } from "survey-react-ui";

import { useApi } from "../utils/api";
import { themes } from "../utils/themeOptions";
import Logger from "../utils/logger";

import { useLocation } from "react-router-dom";
import { SurveyQuestionEditorDefinition } from "survey-creator-core";
import Loading from "../components/Loading";

// SurveyJS Theme Selector Component
import ThemeSelector from "../components/ThemeSelector";

// Icons
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaFilePdf, FaUser, FaCalendarAlt, FaEye, FaPlay, FaCog } from 'react-icons/fa';

// Global window interface
declare global {
  interface Window {
    rerunSurvey: () => void;
  }
}

// SurveyJS matrix dropdown extensions
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

// Enhanced SurveyJS Theme Mapping with proper theme objects
const createSurveyTheme = (themeName: string): ITheme => {
  const baseTheme: ITheme = {
    cssVariables: {
      "--sjs-corner-radius": "4px",
      "--sjs-base-unit": "8px",
    }
  };

  // Color theme configurations
  const colorThemes: { [key: string]: any } = {
    default: {},
    modern: {
      cssVariables: {
        "--sjs-corner-radius": "8px",
        "--sjs-base-unit": "8px",
      }
    },
    sharp: {
      cssVariables: {
        "--sjs-corner-radius": "0px",
      }
    },
    blue: {
      cssVariables: {
        "--sjs-primary-backcolor": "#3b82f6",
        "--sjs-primary-forecolor": "#ffffff",
      }
    },
    green: {
      cssVariables: {
        "--sjs-primary-backcolor": "#10b981",
        "--sjs-primary-forecolor": "#ffffff",
      }
    },
    purple: {
      cssVariables: {
        "--sjs-primary-backcolor": "#8b5cf6",
        "--sjs-primary-forecolor": "#ffffff",
      }
    },
    red: {
      cssVariables: {
        "--sjs-primary-backcolor": "#ef4444",
        "--sjs-primary-forecolor": "#ffffff",
      }
    },
    orange: {
      cssVariables: {
        "--sjs-primary-backcolor": "#f97316",
        "--sjs-primary-forecolor": "#ffffff",
      }
    },
    yellow: {
      cssVariables: {
        "--sjs-primary-backcolor": "#eab308",
        "--sjs-primary-forecolor": "#ffffff",
      }
    },
    teal: {
      cssVariables: {
        "--sjs-primary-backcolor": "#14b8a6",
        "--sjs-primary-forecolor": "#ffffff",
      }
    },
    pink: {
      cssVariables: {
        "--sjs-primary-backcolor": "#ec4899",
        "--sjs-primary-forecolor": "#ffffff",
      }
    },
    indigo: {
      cssVariables: {
        "--sjs-primary-backcolor": "#6366f1",
        "--sjs-primary-forecolor": "#ffffff",
      }
    },
    stone: {
      cssVariables: {
        "--sjs-primary-backcolor": "#78716c",
        "--sjs-primary-forecolor": "#ffffff",
        "--sjs-general-backcolor": "#f5f5f4",
        "--sjs-general-backcolor-dark": "#e7e5e4",
      }
    },
    darkblue: {
      cssVariables: {
        "--sjs-primary-backcolor": "#1e3a8a",
        "--sjs-primary-forecolor": "#ffffff",
        "--sjs-general-backcolor": "#1f2937",
        "--sjs-general-forecolor": "#ffffff",
      }
    },
    darkgreen: {
      cssVariables: {
        "--sjs-primary-backcolor": "#065f46",
        "--sjs-primary-forecolor": "#ffffff",
        "--sjs-general-backcolor": "#1f2937",
        "--sjs-general-forecolor": "#ffffff",
      }
    },
    darkrose: {
      cssVariables: {
        "--sjs-primary-backcolor": "#881337",
        "--sjs-primary-forecolor": "#ffffff",
        "--sjs-general-backcolor": "#1f2937",
        "--sjs-general-forecolor": "#ffffff",
      }
    },
    winter: {
      cssVariables: {
        "--sjs-primary-backcolor": "#0f172a",
        "--sjs-primary-forecolor": "#ffffff",
        "--sjs-general-backcolor": "#f8fafc",
        "--sjs-general-backcolor-dark": "#e2e8f0",
      }
    }
  };

  return {
    ...baseTheme,
    ...colorThemes[themeName],
    themeName: themeName
  };
};

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

const Run = () => {
  const { id } = useParams();
  const location = useLocation();
  const { result_id: initialResultId } = location.state || {};
  let result_id = initialResultId;
  Logger.info("Run state: result_id", result_id);

  const queryParams = new URLSearchParams(window.location.search);
  const userId = queryParams.get("inspectedby")
    ? queryParams.get("inspectedby")
    : (queryParams.get("userid") ? queryParams.get("userid") : "noname");

  result_id = queryParams.get("id") || result_id;
  let viewOnly = false;
  if (queryParams.get("view") === "1") {
    viewOnly = true;
  }

  const { fetchData, postData } = useApi();
  const [survey, setSurvey] = useState({ json: "", name: " " });
  const [result, setResult] = useState({});
  const [theme, setTheme] = useState<ITheme>(themes[0]);
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [currentSurveyTheme, setCurrentSurveyTheme] = useState("default");
  const [surveyModel, setSurveyModel] = useState<Model | null>(null);
  const [renderKey, setRenderKey] = useState(0);

  // Helper function to format survey data for display
  const formatSurveyDataForDisplay = (data: any) => {
    let html = '<div class="mt-8 text-left max-w-4xl mx-auto">';
    html += '<h3 class="text-xl font-bold text-gray-900 mb-4 text-center">Survey Responses</h3>';
    html += '<div class="bg-gray-50 rounded-lg p-6">';
    
    for (const [key, value] of Object.entries(data)) {
      if (value !== null && value !== undefined && value !== '') {
        html += '<div class="mb-4 border-b border-gray-200 pb-3">';
        html += `<div class="font-semibold text-gray-700 mb-1">${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</div>`;
        
        if (typeof value === 'object' && value !== null) {
          if (Array.isArray(value)) {
            html += `<div class="text-gray-600">${value.join(', ')}</div>`;
          } else {
            html += `<div class="text-gray-600">${JSON.stringify(value, null, 2).replace(/[{}"\[\]]/g, '').replace(/,/g, ', ')}</div>`;
          }
        } else {
          html += `<div class="text-gray-600">${value}</div>`;
        }
        html += '</div>';
      }
    }
    
    html += '</div></div>';
    return html;
  };

  // Create professional print-ready report
  const createPrintOnlyReport = (data: any, surveyTitle: string) => {
    let html = '<div class="print-only-report" style="display: none;">';
    
    // Professional Header
    html += `<div class="print-header">`;
    html += `<div class="print-header-top">`;
    html += `<div class="print-logo">`;
    html += `<div class="uct-logo">UCT</div>`;
    html += `</div>`;
    html += `<div class="print-title">`;
    html += `<h1>Final Integration Checklist</h1>`;
    html += `</div>`;
    html += `</div>`;
    
    // Survey Info Section
    html += `<div class="print-info-section">`;
    html += `<div class="print-survey-name">${surveyTitle}</div>`;
    html += `<div class="print-metadata">`;
    html += `<div class="metadata-row">`;
    html += `<span class="metadata-label">Survey ID:</span> <span class="metadata-value">${id}</span>`;
    html += `<span class="metadata-label">Date:</span> <span class="metadata-value">${new Date().toLocaleDateString()}</span>`;
    html += `</div>`;
    if (userId !== "noname") {
      html += `<div class="metadata-row">`;
      html += `<span class="metadata-label">User:</span> <span class="metadata-value">${userId}</span>`;
      html += `</div>`;
    }
    html += `</div>`;
    html += `</div>`;
    html += `</div>`; // Close print-header
    
    // Survey Content
    html += '<div class="print-content">';
    
    // Group data by sections for better organization
    const groupedData: { [key: string]: any } = {};
    Object.entries(data).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        const section = key.includes('_header') ? 'Header Information' : 
                      key.includes('_content') ? 'Content Details' :
                      key.includes('checklist') ? 'Checklist Items' : 'General Information';
        
        if (!groupedData[section]) {
          groupedData[section] = {};
        }
        groupedData[section][key] = value;
      }
    });
    
    // Render grouped sections
    Object.entries(groupedData).forEach(([sectionName, sectionData]) => {
      html += `<div class="print-section">`;
      html += `<h3 class="print-section-title">${sectionName}</h3>`;
      html += `<div class="print-section-content">`;
      
      Object.entries(sectionData).forEach(([key, value]) => {
        html += '<div class="print-field">';
        html += `<div class="print-field-label">${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</div>`;
        
        if (typeof value === 'object' && value !== null) {
          if (Array.isArray(value)) {
            html += `<div class="print-field-value">${value.join(', ')}</div>`;
          } else {
            html += `<div class="print-field-value">${JSON.stringify(value, null, 2).replace(/[{}"\[\]]/g, '').replace(/,/g, ', ')}</div>`;
          }
        } else {
          html += `<div class="print-field-value">${value}</div>`;
        }
        html += '</div>';
      });
      
      html += `</div></div>`; // Close section content and section
    });
    
    html += '</div></div>'; // Close print-content and print-only-report
    return html;
  };

  // Initialize model when survey data is available
  useEffect(() => {
    if (survey.json) {
      const model = initializeModelFromURL(window.location.search, survey.json);
      
      // Set up rerun function
      window.rerunSurvey = () => {
        model.clear(false);
      };

      // Configure serialization
      Serializer.getProperty("survey", "clearInvisibleValues").defaultValue = "none";

      // Set view mode
      if (viewOnly) {
        model.mode = "display";
      }

      // Set up completion handler
      model.onComplete.add(async (sender: Model) => {
        Logger.debug("onComplete Survey data:", sender.data);
        
        // Generate completion HTML with survey data for screen display
        const surveyDataHtml = formatSurveyDataForDisplay(sender.data);
        
        // Generate professional print-only report
        const printOnlyReport = createPrintOnlyReport(sender.data, survey.name);
        
        sender.completedHtml = `
          <div class="bg-white rounded-lg p-8 text-center screen-only">
            <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h2 class="text-2xl font-bold text-gray-900 mb-2">Thank you for your work!</h2>
            <p class="text-gray-600 mb-6">Your checklist has been completed successfully.</p>
            
            ${surveyDataHtml}
            
            <div class="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <button class="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200" onclick="window.rerunSurvey()">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
                Run Survey Again
              </button>
              <button class="inline-flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200" onclick="window.print()">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                Save as PDF
              </button>
            </div>
          </div>
          ${printOnlyReport}
        `;
        
        // Save survey data
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
  }, [survey.json, id, userId, viewOnly, postData]);

  // Apply theme to model when theme changes
  const applyThemeToModel = (themeName: string) => {
    if (surveyModel) {
      const selectedTheme = createSurveyTheme(themeName);
      Logger.info("Applying theme:", themeName, selectedTheme);
      
      try {
        surveyModel.applyTheme(selectedTheme);
        setCurrentSurveyTheme(themeName);
        
        // Force re-render by incrementing render key
        setRenderKey(prev => prev + 1);
        
        Logger.info("Theme applied successfully:", themeName);
      } catch (error) {
        Logger.error("Error applying theme:", error);
      }
    }
  };

  const getTheme = async () => {
    try {
      const response = await fetchData("/getTheme?surveyId=" + id, false);
      if (response.data && response.data.theme) {
        const parsedTheme = JSON.parse(response.data.theme);
        setTheme(parsedTheme);
        if (surveyModel) {
          surveyModel.applyTheme(parsedTheme);
        }
      } else {
        // Apply default theme
        applyThemeToModel("default");
      }
    } catch (error) {
      Logger.error("Error getting theme:", error);
      applyThemeToModel("default");
    }
  };

  const getSurvey = async () => {
    try {
      const response = await fetchData("/getSurvey?surveyId=" + id, false);
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

  const shouldGetResults = surveyModel && (!surveyModel
    .getAllQuestions()
    .some((question) => question.name === "datacollection_header") || result_id);

  useEffect(() => {
    if (shouldGetResults) {
      getResults();
    }
  }, [result_id, shouldGetResults]);

  useEffect(() => {
    getSurvey();
  }, []);

  useEffect(() => {
    if (surveyModel) {
      getTheme();
    }
  }, [surveyModel]);

  // Apply result data to model
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

  if (survey.json === "" || !surveyModel) {
    return (
      <div className="min-h-screen theme-bg-primary flex items-center justify-center">
        <div className="text-center">
          <Loading />
          <p className="mt-4 theme-text-secondary">Loading checklist...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen theme-bg-primary">
      {/* Enhanced Print Styles */}
      <style>{`
        @media print {
          /* Hide screen elements */
          .no-print, .screen-only {
            display: none !important;
          }
          
          /* Show print elements */
          .print-only-report {
            display: block !important;
          }
          
          /* Reset visibility */
          body, * {
            visibility: hidden;
          }
          
          /* Make print content visible */
          .survey-container, 
          .survey-container *,
          .print-only-report,
          .print-only-report * {
            visibility: visible;
          }
          
          /* Position print content */
          .survey-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0;
            margin: 0;
          }
          
          /* Professional Print Header */
          .print-header {
            padding: 20px 0;
            margin-bottom: 30px;
            border-bottom: 3px solid #2563eb;
          }
          
          .print-header-top {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 20px;
          }
          
          .uct-logo {
            font-size: 32px;
            font-weight: bold;
            color: #2563eb;
            background: linear-gradient(45deg, #2563eb, #06b6d4);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          
          .print-title h1 {
            font-size: 28px;
            font-weight: bold;
            color: #1f2937;
            margin: 0;
            text-align: center;
            flex-grow: 1;
          }
          
          .print-info-section {
            background: #f8fafc;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
          }
          
          .print-survey-name {
            font-size: 18px;
            font-weight: 600;
            color: #374151;
            margin-bottom: 10px;
            text-align: center;
          }
          
          .print-metadata {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
          
          .metadata-row {
            display: flex;
            gap: 20px;
            justify-content: center;
            flex-wrap: wrap;
          }
          
          .metadata-label {
            font-weight: 600;
            color: #4b5563;
          }
          
          .metadata-value {
            color: #1f2937;
          }
          
          /* Content Sections */
          .print-content {
            padding-top: 20px;
          }
          
          .print-section {
            margin-bottom: 25px;
            break-inside: avoid;
          }
          
          .print-section-title {
            font-size: 16px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 12px;
            padding-bottom: 5px;
            border-bottom: 2px solid #e5e7eb;
          }
          
          .print-section-content {
            display: grid;
            gap: 12px;
          }
          
          .print-field {
            display: grid;
            grid-template-columns: 1fr 2fr;
            gap: 10px;
            padding: 8px;
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 4px;
          }
          
          .print-field-label {
            font-weight: 600;
            color: #374151;
            font-size: 12px;
          }
          
          .print-field-value {
            color: #1f2937;
            font-size: 12px;
            word-break: break-word;
          }
          
          /* Page settings */
          @page {
            margin: 0.75in;
            size: A4;
          }
          
          /* Page breaks */
          .print-section {
            page-break-inside: avoid;
          }
          
          /* Table styling for better readability */
          table {
            border-collapse: collapse;
            width: 100%;
            margin: 10px 0;
          }
          
          th, td {
            border: 1px solid #d1d5db;
            padding: 8px;
            text-align: left;
            font-size: 11px;
          }
          
          th {
            background-color: #f3f4f6;
            font-weight: 600;
          }
        }
      `}</style>

      {/* Header with Back Button */}
      <div className="theme-bg-secondary theme-border-light border-b sticky top-0 z-10 theme-shadow no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left side - Back button and title */}
            <div className="flex items-center space-x-4">
              <Link 
                to="/" 
                className="inline-flex items-center px-4 py-2 text-sm font-medium theme-text-secondary theme-bg-secondary theme-border-light border rounded-md hover:theme-bg-tertiary theme-hover-blue transition-colors duration-200 theme-shadow"
              >
                <FaArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Link>
              
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  viewOnly ? 'theme-bg-tertiary' : 'bg-green-100'
                }`}>
                  {viewOnly ? (
                    <FaEye className="w-4 h-4 theme-text-secondary" />
                  ) : (
                    <FaPlay className="w-4 h-4 text-green-600" />
                  )}
                </div>
                <div>
                  <h1 className="text-lg font-semibold theme-text-primary">
                    {viewOnly ? 'Viewing' : 'Running'} Checklist
                  </h1>
                  <p className="text-sm theme-text-secondary">{survey.name}</p>
                </div>
              </div>
            </div>

            {/* Right side - Theme selector and PDF button */}
            <div className="flex items-center space-x-4">
              {userId !== "noname" && (
                <div className="flex items-center space-x-2 text-sm theme-text-secondary">
                  <FaUser className="w-4 h-4" />
                  <span>{userId}</span>
                </div>
              )}

              {/* PDF Generation Button */}
              <button
                onClick={() => window.print()}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 border border-red-600 rounded-md transition-colors duration-200"
                title="Generate PDF"
              >
                <FaFilePdf className="w-4 h-4 mr-2" />
                PDF
              </button>

              {/* Theme Selector */}
              <button
                onClick={() => setShowThemeSelector(!showThemeSelector)}
                className="inline-flex items-center px-3 py-2 text-sm font-medium theme-text-secondary theme-bg-secondary theme-border-light border rounded-md hover:theme-bg-tertiary transition-colors duration-200"
                title="Change Survey Theme"
              >
                <FaCog className="w-4 h-4 mr-2" />
                Theme
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Theme Selector Panel */}
      {showThemeSelector && (
        <div className="theme-bg-secondary theme-border-light border-b px-4 py-4 no-print">
          <div className="max-w-7xl mx-auto flex justify-end">
            <div className="w-80">
              <ThemeSelector
                currentTheme={currentSurveyTheme}
                onThemeChange={applyThemeToModel}
                compact={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* Survey Container */}
      <div className="max-w-6xl mx-auto p-6 survey-container">
        <div className="theme-bg-secondary rounded-lg theme-shadow theme-border-light border overflow-hidden">
          {/* Survey Info Bar */}
          <div className="theme-bg-tertiary px-6 py-3 theme-border-light border-b no-print">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-4">
                <span className="theme-text-secondary">Survey ID: {id}</span>
                {result_id && (
                  <span className="theme-text-secondary">Result ID: {result_id}</span>
                )}
                <span className="theme-text-secondary">Theme: {currentSurveyTheme}</span>
              </div>
              <div className="flex items-center space-x-2">
                <FaCalendarAlt className="w-4 h-4 theme-text-secondary" />
                <span className="theme-text-secondary">
                  {new Date().toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Survey Content */}
          <div className="p-6">
            <Survey key={renderKey} model={surveyModel} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Run;