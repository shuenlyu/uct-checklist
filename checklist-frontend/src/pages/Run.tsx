// Simplified Run.tsx - Sequential Page Workflow
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

interface PDFMetadata {
  title: string;
  systemName: string;
  organizationName: string;
  logo?: string;
  additionalInfo?: string;
  showMetadata?: boolean;
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

// PDF generation functions remain the same as in your original code
async function generateUniversalPDF(surveyModel: Model, userId: string, checklistName: string = 'Checklist') {
  try {
    Logger.info("🚀 Starting Universal PDF generation...");
    
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

// Email and save functions remain the same...

const Run = () => {
  const { id } = useParams();
  const location = useLocation();
  const { result_id: initialResultId } = location.state || {};
  let result_id = initialResultId;

  const queryParams = new URLSearchParams(window.location.search);
  result_id = queryParams.get("id") || result_id;
  
  let viewOnly = false;
  if (queryParams.get("view") === "1") {
    viewOnly = true;
  }

  const { fetchData, postData } = useApi();
  const [survey, setSurvey] = useState({ json: "", name: " " });
  const [surveyModel, setSurveyModel] = useState<Model | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Progress tracking states
  const [pageProgress, setPageProgress] = useState<PageProgress[]>([]);
  const [currentProgress, setCurrentProgress] = useState<CurrentProgress | null>(null);
  const [isSubmittingPage, setIsSubmittingPage] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  
  // PDF states
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isEmailingPDF, setIsEmailingPDF] = useState(false);
  const [isSavingToSharedFolder, setIsSavingToSharedFolder] = useState(false);
  
  // Completion states
  const [isCompleted, setIsCompleted] = useState(false);
  const [completedSurveyData, setCompletedSurveyData] = useState<any>(null);

  // Theme states
  const [theme, setTheme] = useState<ITheme>(themes[0]);
  const [selectedThemeIndex, setSelectedThemeIndex] = useState<number>(0);
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);

  // Get current authenticated user
  const getCurrentUser = async () => {
    try {
      const response = await fetchData("/getMe", false);
      if (response.user) {
        setCurrentUser(response.user);
        Logger.info("👤 Current user:", response.user.email);
      }
    } catch (error) {
      Logger.error("❌ Error getting current user:", error);
      // Fallback for non-authenticated environments
      setCurrentUser({ email: 'anonymous@uct.local' });
    }
  };

  // Load progress data
  const loadProgress = async () => {
    try {
      const response = await fetchData(`/getProgress?postId=${id}`, false);
      setPageProgress(response || []);
      Logger.info("📊 Page progress loaded:", response?.length || 0, "pages");
    } catch (error) {
      Logger.error("❌ Error loading progress:", error);
    }
  };

  // Auto-save current progress
  const autoSaveProgress = async (model: Model) => {
    if (!currentUser || isAutoSaving) return;
    
    setIsAutoSaving(true);
    try {
      await postData("/saveProgress", {
        postId: id as string,
        currentData: model.data,
        currentPageNo: model.currentPageNo,
        userId: currentUser.email
      }, false);
      
      Logger.debug("💾 Auto-saved progress");
    } catch (error) {
      Logger.error("❌ Auto-save failed:", error);
    } finally {
      setIsAutoSaving(false);
    }
  };

  // Submit current page
  const submitCurrentPage = async () => {
    if (!surveyModel || !currentUser || isSubmittingPage) return;
    
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
        userId: currentUser.email
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

  // Check if current page is completed
  const isCurrentPageCompleted = () => {
    if (!surveyModel) return false;
    return pageProgress.some(p => p.pageIndex === surveyModel.currentPageNo && p.isCompleted);
  };

  // Check if all pages are completed
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
    if (survey.json && currentUser) {
      const model = initializeModelFromURL(window.location.search, survey.json);
      
      Logger.info("🔧 Model Initialized with Sequential Page Workflow");
      Logger.info("📊 Survey details:", {
        questions: model.getAllQuestions().length,
        pages: model.pages.length,
        title: model.title,
        user: currentUser.email
      });

      // Setup auto-save on data change
      model.onValueChanged.add((sender) => {
        autoSaveProgress(sender);
      });

      // Setup page change handler
      model.onCurrentPageChanged.add((sender) => {
        autoSaveProgress(sender);
      });

      // Setup completion handler
      model.onComplete.add(async (sender: Model) => {
        if (!areAllPagesCompleted()) {
          alert("Please submit all pages before completing the checklist.");
          return;
        }
        
        Logger.debug("🏁 Checklist completed by:", currentUser.email);
        
        // Save final data
        await postData(
          "/post",
          {
            postId: id as string,
            surveyResult: sender.data,
            userId: currentUser.email,
            createdAt: new Date().toISOString(),
          },
          false
        );
        
        setCompletedSurveyData({ ...sender.data });
        setIsCompleted(true);
        
        Logger.info("✅ Checklist completed successfully");
      });

      // Configure serialization
      Serializer.getProperty("survey", "clearInvisibleValues").defaultValue = "none";

      // Set view mode if needed
      if (viewOnly) {
        model.mode = "display";
      }

      setSurveyModel(model);
    }
  }, [survey.json, currentUser, pageProgress]);

  // Load survey data
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

// Initial data loading - same as your original code
useEffect(() => {
  getSurvey();
  getCurrentUser(); // Try to get user but don't wait for it
  loadProgress(); // Load progress regardless of authentication
}, []);

  // Apply existing progress to model
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
          Logger.error("❌ Error getting theme:", error);
        }
      };
      loadTheme();
    }
  }, [surveyModel, selectedThemeIndex]);

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
    if (!surveyModel) return null;

    const totalPages = surveyModel.pageCount;
    const currentPageIndex = surveyModel.currentPageNo;
    
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
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

  // Page Actions Component
  const PageActions = () => {
    if (!surveyModel || viewOnly) return null;

    const canSubmitPage = surveyModel.currentPage.validate();
    const isCurrentCompleted = isCurrentPageCompleted();
    const isLastPage = surveyModel.currentPageNo === surveyModel.pageCount - 1;
    const allCompleted = areAllPagesCompleted();
    
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
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
            <p className="text-gray-600 mb-6">The entire checklist workflow has been completed.</p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <button 
                className={`inline-flex items-center px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors duration-200 ${isGeneratingPDF ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => generateUniversalPDF(surveyModel, currentUser?.email || 'anonymous', survey.name)}
                disabled={isGeneratingPDF}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                {isGeneratingPDF ? 'Generating...' : 'Download PDF'}
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
              <span className="text-white text-sm">{currentUser.email}</span>
              <ThemeSelector />
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