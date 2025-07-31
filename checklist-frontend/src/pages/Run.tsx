// src/pages/Run.tsx - Fixed Theme Position & Application
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
import { themes } from "../utils/themeOptions"; // Your existing themes
import Logger from "../utils/logger";

import { useLocation } from "react-router-dom";
import { SurveyQuestionEditorDefinition } from "survey-creator-core";
import Loading from "../components/Loading";

// SurveyJS Theme Selector Component
import ThemeSelector from "../components/ThemeSelector";

// ADD THESE IMPORTS FOR BACK BUTTON
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
  const [surveyModel, setSurveyModel] = useState<Model | null>(null); // Track model state
  const [renderKey, setRenderKey] = useState(0); // Force re-render key

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

  // Helper function to create print-only survey report
  const createPrintOnlyReport = (data: any) => {
    let html = '<div class="print-only-report" style="display: none;">';
    html += `<div class="print-header-content">`;
    html += `<h1 class="text-2xl font-bold text-gray-900 mb-2">${survey.name}</h1>`;
    html += `<div class="text-sm text-gray-600 mb-6">`;
    html += `<p>Survey ID: ${id}</p>`;
    html += `<p>Date: ${new Date().toLocaleDateString()}</p>`;
    if (userId !== "noname") html += `<p>User: ${userId}</p>`;
    html += `</div>`;
    html += `</div>`;
    
    html += '<div class="survey-responses-print">';
    
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

  // Initialize model when survey data is available
  useEffect(() => {
    if (survey.json) {
      const model = initializeModelFromURL(window.location.search, survey.json);
      
      // Set up rerun function (only declaration in entire file)
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
        
        // Generate print-only report
        const printOnlyReport = createPrintOnlyReport(sender.data);
        
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
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>
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
      {/* Print Styles */}
      <style>{`
        @media print {
          .no-print, .screen-only {
            display: none !important;
          }
          .print-only-report {
            display: block !important;
          }
          body, * {
            visibility: hidden;
          }
          .survey-container, 
          .survey-container *,
          .print-only-report,
          .print-only-report *,
          .print-header-content,
          .print-header-content *,
          .survey-responses-print,
          .survey-responses-print * {
            visibility: visible;
          }
          .survey-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
          }
          .print-only-report {
            position: relative !important;
            max-width: 100% !important;
            padding: 0 !important;
          }
          .print-header-content {
            margin-bottom: 20px;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 15px;
          }
          .survey-responses-print {
            line-height: 1.6;
          }
          .survey-responses-print .mb-4 {
            margin-bottom: 15px;
          }
          .survey-responses-print .border-b {
            border-bottom: 1px solid #d1d5db;
            padding-bottom: 8px;
          }
          @page {
            margin: 1in;
            size: A4;
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

            {/* Right side - MOVED THEME SELECTOR HERE */}
            <div className="flex items-center space-x-4">
              {userId !== "noname" && (
                <div className="flex items-center space-x-2 text-sm theme-text-secondary">
                  <FaUser className="w-4 h-4" />
                  <span>{userId}</span>
                </div>
              )}

              {/* SurveyJS Theme Selector - NOW ON THE RIGHT */}
              <button
                onClick={() => setShowThemeSelector(!showThemeSelector)}
                className="inline-flex items-center px-3 py-2 text-sm font-medium theme-text-secondary theme-bg-secondary theme-border-light border rounded-md hover:theme-bg-tertiary transition-colors duration-200"
                title="Change Survey Theme"
              >
                <FaCog className="w-4 h-4 mr-2" />
                Survey Theme
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Theme Selector Panel - RIGHT ALIGNED */}
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