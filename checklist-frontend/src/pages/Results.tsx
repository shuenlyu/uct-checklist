import { useEffect, useState } from "react";
import { useParams } from "react-router";
import Layout from "../components/Layout";
import { useApi } from "../utils/api";
import Logger from "../utils/logger";

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

const Results = () => {
  const { id } = useParams();
  const { fetchData } = useApi();
  const [survey, setSurvey] = useState({ json: {}, name: "" });
  const [results, setResults] = useState<ResultItem[]>([]);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState<string | null>(null);
  const [isEmailingPDF, setIsEmailingPDF] = useState<string | null>(null);
  const [isSavingToSharedFolder, setIsSavingToSharedFolder] = useState<string | null>(null);
  const [openDropdowns, setOpenDropdowns] = useState<Set<string>>(new Set());

  // PDF Generation function
  const generateUniversalPDF = async (resultData: ResultItem) => {
    try {
      Logger.info("Starting Universal PDF generation from results...");
      
      const PDF_SERVER_URL = process.env.REACT_APP_PDF_SERVER_URL || 'https://dc-analytics01.uct.local';
      
      if (!survey.json || Object.keys(survey.json).length === 0) {
        throw new Error("Survey structure not loaded");
      }
      
      const surveyJson = survey.json;
      const surveyData = JSON.parse(resultData.json);
      
      const metadata: PDFMetadata = {
        title: survey.name || 'Checklist Results',
        systemName: 'Checklist Manager System',
        organizationName: 'UCT',
        logo: '',
        additionalInfo: `Generated for user: ${resultData.submittedBy}`,
        showMetadata: true
      };
      
      const requestData = {
        surveyJson: surveyJson,
        surveyData: surveyData,
        metadata: metadata,
        fileName: `${survey.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'Checklist'}-${resultData.submittedBy}-${new Date(resultData.createdAt).toISOString().split('T')[0]}.pdf`
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
      
      return true;
      
    } catch (error) {
      Logger.error("Universal PDF generation failed:", error);
      throw error;
    }
  };

  // Email PDF function
  const emailPDF = async (resultData: ResultItem) => {
    try {
      const PDF_SERVER_URL = process.env.REACT_APP_PDF_SERVER_URL || 'https://dc-analytics01.uct.local';
      
      if (!survey.json || Object.keys(survey.json).length === 0) {
        throw new Error("Survey structure not loaded");
      }
      
      const recipientEmail = window.prompt('Enter recipient email address:');
      if (!recipientEmail) {
        return;
      }
      
      const surveyJson = survey.json;
      const surveyData = JSON.parse(resultData.json);
      
      const metadata: PDFMetadata = {
        title: survey.name || 'Checklist Results',
        systemName: 'Checklist Manager System',
        organizationName: 'UCT',
        logo: '',
        additionalInfo: `Generated for user: ${resultData.submittedBy}`,
        showMetadata: true
      };
      
      const requestData = {
        surveyJson: surveyJson,
        surveyData: surveyData,
        metadata: metadata,
        fileName: `${survey.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'Checklist'}-${resultData.submittedBy}-${new Date(resultData.createdAt).toISOString().split('T')[0]}.pdf`,
        recipientEmail: recipientEmail,
        senderName: resultData.submittedBy,
        subject: `Checklist Report: ${survey.name}`
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
        throw new Error(`Email PDF failed: ${errorData.error || 'Unknown error'}`);
      }
      
      const result = await response.json();
      window.alert(`PDF emailed successfully to ${recipientEmail}!`);
      
      return true;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      window.alert(`Email failed: ${errorMessage}`);
      throw error;
    }
  };

  // Save to Shared Folder function
  const saveToSharedFolder = async (resultData: ResultItem) => {
    try {
      const PDF_SERVER_URL = process.env.REACT_APP_PDF_SERVER_URL || 'https://dc-analytics01.uct.local';
      
      if (!survey.json || Object.keys(survey.json).length === 0) {
        throw new Error("Survey structure not loaded");
      }
      
      const surveyJson = survey.json;
      const surveyData = JSON.parse(resultData.json);
      
      const metadata: PDFMetadata = {
        title: survey.name || 'Checklist Results',
        systemName: 'Checklist Manager System',
        organizationName: 'UCT',
        logo: '',
        additionalInfo: `Generated for user: ${resultData.submittedBy}`,
        showMetadata: true
      };
      
      const requestData = {
        surveyJson: surveyJson,
        surveyData: surveyData,
        metadata: metadata,
        fileName: `${survey.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'Checklist'}-${resultData.submittedBy}-${new Date(resultData.createdAt).toISOString().split('T')[0]}.pdf`,
        userId: resultData.submittedBy
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
        throw new Error(`Shared folder save failed: ${errorData.error || 'Unknown error'}`);
      }
      
      const result = await response.json();
      window.alert(`PDF saved successfully to shared folder: ${result.filePath || 'Success'}`);
      
      return true;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      window.alert(`Shared folder save failed: ${errorMessage}`);
      throw error;
    }
  };

  // Handler functions
  const handleGeneratePDF = async (resultData: ResultItem) => {
    if (isGeneratingPDF === resultData.id) return;
    
    setIsGeneratingPDF(resultData.id);
    try {
      await generateUniversalPDF(resultData);
    } catch (error) {
      // Error already handled in the function
    } finally {
      setIsGeneratingPDF(null);
      setOpenDropdowns(new Set());
    }
  };

  const handleEmailPDF = async (resultData: ResultItem) => {
    if (isEmailingPDF === resultData.id) return;
    
    setIsEmailingPDF(resultData.id);
    try {
      await emailPDF(resultData);
    } catch (error) {
      // Error already handled in the function
    } finally {
      setIsEmailingPDF(null);
      setOpenDropdowns(new Set());
    }
  };

  const handleSaveToSharedFolder = async (resultData: ResultItem) => {
    if (isSavingToSharedFolder === resultData.id) return;
    
    setIsSavingToSharedFolder(resultData.id);
    try {
      await saveToSharedFolder(resultData);
    } catch (error) {
      // Error already handled in the function
    } finally {
      setIsSavingToSharedFolder(null);
      setOpenDropdowns(new Set());
    }
  };

  const handleRunChecklist = (resultData: ResultItem) => {
    const queryParams = new URLSearchParams({
      load_existing: 'true',
      id: resultData.id,
      edit: 'true'
    });
    
    window.location.href = `/run/${id}?${queryParams.toString()}`;
  };

  const toggleDropdown = (resultId: string) => {
    const newOpenDropdowns = new Set(openDropdowns);
    if (newOpenDropdowns.has(resultId)) {
      newOpenDropdowns.delete(resultId);
    } else {
      newOpenDropdowns.clear(); // Close other dropdowns
      newOpenDropdowns.add(resultId);
    }
    setOpenDropdowns(newOpenDropdowns);
  };

  const getSurvey = async () => {
    try {
      const response = await fetchData("/getSurvey?surveyId=" + id);
      setSurvey(response.data);
    } catch (error) {
      Logger.error("Error getting survey:", error);
    }
  };

  const getResults = async () => {
    try {
      const response = await fetchData("/results?postId=" + id);
      setResults(response.data);
    } catch (error) {
      Logger.error("Error getting results:", error);
    }
  };

  useEffect(() => {
    getSurvey();
    getResults();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenDropdowns(new Set());
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <Layout fullWidth={true}>
      <div style={{ padding: '20px' }}>
        {survey.name !== "" ? (
          <h1 style={{ textAlign: "center", marginBottom: '20px' }}>
            {"'" + survey.name + "' results"}
          </h1>
        ) : (
          <h1>{""}</h1>
        )}
        
        {/* Custom Results Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">Results</h3>
              <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors">
                CSV
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted By</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Preview</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.map((result) => {
                  const parsedData = JSON.parse(result.json);
                  const dataKeys = Object.keys(parsedData).slice(0, 3);
                  const isDropdownOpen = openDropdowns.has(result.id);
                  
                  return (
                    <tr key={result.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleDropdown(result.id);
                            }}
                            className="inline-flex items-center p-2 text-gray-400 bg-transparent rounded-lg hover:bg-gray-100 hover:text-gray-600 focus:outline-none"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"></path>
                            </svg>
                          </button>
                          
                          {isDropdownOpen && (
                            <div 
                              className="absolute left-0 top-full mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="py-2">
                                <button
                                  onClick={() => handleRunChecklist(result)}
                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                >
                                  <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                                  </svg>
                                  Run
                                </button>
                                
                                <hr className="my-1 border-gray-200" />
                                
                                <button
                                  onClick={() => handleGeneratePDF(result)}
                                  disabled={isGeneratingPDF === result.id}
                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                  </svg>
                                  {isGeneratingPDF === result.id ? 'Generating...' : 'Download PDF'}
                                </button>
                                
                                <button
                                  onClick={() => handleEmailPDF(result)}
                                  disabled={isEmailingPDF === result.id}
                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                                  </svg>
                                  {isEmailingPDF === result.id ? 'Sending...' : 'Email PDF'}
                                </button>
                                
                                <button
                                  onClick={() => handleSaveToSharedFolder(result)}
                                  disabled={isSavingToSharedFolder === result.id}
                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4-1v8m0 0l3-3m-3 3L9 8m-5 5h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H17M13 13h8m0 0V9m0 4l-3-3"></path>
                                  </svg>
                                  {isSavingToSharedFolder === result.id ? 'Saving...' : 'Save to Shared Folder'}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {result.submittedBy}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(result.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        <div className="max-w-xs truncate">
                          {dataKeys.map(key => `${key}: ${String(parsedData[key]).substring(0, 20)}`).join(', ')}
                          {dataKeys.length > 0 && '...'}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {results.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No results found for this checklist.
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Results;