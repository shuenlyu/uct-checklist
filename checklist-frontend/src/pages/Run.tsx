// src/pages/Run.tsx - SurveyJS PDF Generator - Universal Solution
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

// SurveyJS PDF Generator - Correct Import
import { SurveyPDF } from "survey-pdf";

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
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

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

  // SurveyJS PDF Generator - Correct API Implementation
  const generateSurveyPDF = async (model: Model) => {
    if (isGeneratingPDF) {
      Logger.info("PDF generation already in progress, skipping...");
      return;
    }

    // Get survey JSON and clean it (moved outside try block for scope)
    const surveyJSON = JSON.parse(JSON.stringify(model.toJSON()));
    
    // Add professional title and description
    if (!surveyJSON.title || surveyJSON.title.trim() === '') {
      surveyJSON.title = "Final Integration Checklist";
    }
    
    // Add header info to description
    const headerInfo = `UCT Survey | ID: ${id || 'N/A'} | Date: ${new Date().toLocaleDateString()} | User: ${userId !== "noname" ? userId : 'N/A'}`;
    if (!surveyJSON.description || surveyJSON.description.trim() === '') {
      surveyJSON.description = headerInfo;
    } else {
      surveyJSON.description = headerInfo + "\n" + surveyJSON.description;
    }

    try {
      setIsGeneratingPDF(true);
      Logger.info("Starting SurveyJS PDF generation...");

      Logger.info("Creating SurveyPDF instance...");
      
      // Create SurveyPDF with working configuration
      const options = {
        format: [210, 297], // A4 format
        fontSize: 12,
        margins: {
          left: 20,
          right: 20,
          top: 20,
          bot: 20
        }
      };
      
      const surveyPdf = new SurveyPDF(surveyJSON, options);
      
      // Set the survey data
      const surveyData = model.data || {};
      Logger.info("Setting survey data:", surveyData);
      surveyPdf.data = surveyData;

      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0];
      const timeString = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
      const surveyId = id ? id.substring(0, 8) : 'survey';
      const filename = `UCT_Checklist_${surveyId}_${timestamp}_${timeString}`;
      
      Logger.info("Saving PDF with filename:", filename);
      
      // Use the correct SurveyJS PDF save method
      surveyPdf.save(filename);
      
      Logger.info("PDF save method called");
      
      // Give browser time to process the download
      setTimeout(() => {
        Logger.info("PDF generation completed");
        alert(
          `✅ PDF "${filename}.pdf" has been generated!\n\n` +
          `📁 Location: Check your Downloads folder\n` +
          `📱 Browser: Look for download notification\n` +
          `📄 Filename: ${filename}.pdf\n\n` +
          `If you don't see it:\n` +
          `• Press Ctrl+J (Chrome) or Ctrl+Shift+Y (Firefox)\n` +
          `• Check browser download settings\n` +
          `• Look for popup blocker notifications`
        );
      }, 2000);
      
      Logger.info("SurveyJS PDF generation process completed");
      
    } catch (error) {
      Logger.error("SurveyJS PDF generation failed:", error);
      
      // User-friendly error message with fallback option
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Try alternative approach if main method fails
      try {
        Logger.info("Trying fallback PDF generation...");
        
        // Create simpler PDF instance
        const fallbackPdf = new SurveyPDF(surveyJSON);
        fallbackPdf.data = model.data || {};
        
        const fallbackFilename = `UCT_PDF_${Date.now()}`;
        fallbackPdf.save(fallbackFilename);
        
        setTimeout(() => {
          alert(`Fallback PDF saved as: ${fallbackFilename}.pdf`);
        }, 1500);
        
        Logger.info("Fallback PDF generation completed");
        
      } catch (fallbackError) {
        Logger.error("Fallback PDF generation also failed:", fallbackError);
        
        const fullMessage = `PDF generation failed: ${errorMessage}\n\nWould you like to try the browser print option instead?`;
        
        if (window.confirm(fullMessage)) {
          // Fallback to browser print
          window.print();
        }
      }
    } finally {
      setIsGeneratingPDF(false);
    }
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
        
        sender.completedHtml = `
          <div class="bg-white rounded-lg p-8 text-center">
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
              <button id="completionPdfBtn" class="inline-flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200" onclick="generateCompletionPDF()">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                <span>Download PDF</span>
              </button>
            </div>
          </div>
        `;
        
        // Make PDF generation available from completion page
        (window as any).generateCompletionPDF = async () => {
          Logger.info("PDF generation triggered from completion page");
          const btn = document.getElementById('completionPdfBtn');
          if (btn) {
            btn.innerHTML = '<span class="inline-flex items-center"><svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Generating PDF...</span>';
            btn.setAttribute('disabled', 'true');
          }
          
          await generateSurveyPDF(sender);
          
          if (btn) {
            btn.innerHTML = '<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg><span>Download PDF</span>';
            btn.removeAttribute('disabled');
          }
        };
        
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

  // Handle PDF generation from toolbar
  const handleGeneratePDF = async () => {
    if (!surveyModel) {
      alert("Survey is not ready. Please wait for the survey to load completely.");
      return;
    }

    Logger.info("PDF generation triggered from toolbar");
    await generateSurveyPDF(surveyModel);
  };

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
                onClick={handleGeneratePDF}
                disabled={isGeneratingPDF}
                className={`inline-flex items-center px-3 py-2 text-sm font-medium text-white border rounded-md transition-colors duration-200 ${
                  isGeneratingPDF 
                    ? 'bg-gray-400 border-gray-400 cursor-not-allowed' 
                    : 'bg-red-600 hover:bg-red-700 border-red-600'
                }`}
                title="Generate PDF using SurveyJS"
              >
                {isGeneratingPDF ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>
                    <FaFilePdf className="w-4 h-4 mr-2" />
                    PDF
                  </>
                )}
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