import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { useApi } from "../utils/api";
import Logger from "../utils/logger";

interface InFlightItem {
  postId: string;
  surveyName: string;
  totalPages: number;
  completedPages: number;
  lastEditedBy: string;
  lastUpdated: string;
  currentPageNo: number;
}

interface PDFMetadata {
  title: string;
  systemName: string;
  organizationName: string;
  logo?: string;
  additionalInfo?: string;
  showMetadata?: boolean;
}

const InFlight = () => {
  const { fetchData, postData } = useApi();
  const [inFlightChecklists, setInFlightChecklists] = useState<InFlightItem[]>([]);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState<string | null>(null);
  const [isEmailingPDF, setIsEmailingPDF] = useState<string | null>(null);
  const [isSavingToSharedFolder, setIsSavingToSharedFolder] = useState<string | null>(null);
  const [openDropdowns, setOpenDropdowns] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  // PDF Generation function
  const generateUniversalPDF = async (item: InFlightItem) => {
    try {
      Logger.info("Starting Universal PDF generation from in-flight checklist...");
      
      const PDF_SERVER_URL = process.env.REACT_APP_PDF_SERVER_URL || 'https://dc-analytics01.uct.local';
      
      // Get survey structure
      const surveyResponse = await fetchData(`/getSurvey?surveyId=${item.postId}`);
      if (!surveyResponse.data || !surveyResponse.data.json) {
        throw new Error("Survey structure not found");
      }
      
      // Get current progress data
      const progressResponse = await fetchData(`/getProgress?postId=${item.postId}`);
      const progressData = progressResponse?.data || [];
      
      // Merge all completed page data
      let surveyData = {};
      progressData.forEach((progress: any) => {
        if (progress.isCompleted && progress.pageData) {
          surveyData = { ...surveyData, ...progress.pageData };
        }
      });
      
      const surveyJson = JSON.parse(surveyResponse.data.json);
      
      const metadata: PDFMetadata = {
        title: `${item.surveyName} (In Progress)`,
        systemName: 'Checklist Manager System',
        organizationName: 'UCT',
        logo: '',
        additionalInfo: `Generated for user: ${item.lastEditedBy} - Progress: ${item.completedPages}/${item.totalPages} pages`,
        showMetadata: true
      };
      
      const requestData = {
        surveyJson: surveyJson,
        surveyData: surveyData,
        metadata: metadata,
        fileName: `${item.surveyName.replace(/[^a-zA-Z0-9]/g, '_')}-InProgress-${item.lastEditedBy}-${new Date().toISOString().split('T')[0]}.pdf`
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
  const emailPDF = async (item: InFlightItem) => {
    try {
      const PDF_SERVER_URL = process.env.REACT_APP_PDF_SERVER_URL || 'https://dc-analytics01.uct.local';
      
      const recipientEmail = window.prompt('Enter recipient email address:');
      if (!recipientEmail) {
        return;
      }
      
      // Get survey structure and progress (same as PDF generation)
      const surveyResponse = await fetchData(`/getSurvey?surveyId=${item.postId}`);
      const progressResponse = await fetchData(`/getProgress?postId=${item.postId}`);
      const progressData = progressResponse?.data || [];
      
      let surveyData = {};
      progressData.forEach((progress: any) => {
        if (progress.isCompleted && progress.pageData) {
          surveyData = { ...surveyData, ...progress.pageData };
        }
      });
      
      const surveyJson = JSON.parse(surveyResponse.data.json);
      
      const metadata: PDFMetadata = {
        title: `${item.surveyName} (In Progress)`,
        systemName: 'Checklist Manager System',
        organizationName: 'UCT',
        logo: '',
        additionalInfo: `Generated for user: ${item.lastEditedBy} - Progress: ${item.completedPages}/${item.totalPages} pages`,
        showMetadata: true
      };
      
      const requestData = {
        surveyJson: surveyJson,
        surveyData: surveyData,
        metadata: metadata,
        fileName: `${item.surveyName.replace(/[^a-zA-Z0-9]/g, '_')}-InProgress-${item.lastEditedBy}-${new Date().toISOString().split('T')[0]}.pdf`,
        recipientEmail: recipientEmail,
        senderName: item.lastEditedBy,
        subject: `In Progress Checklist Report: ${item.surveyName}`
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
      
      window.alert(`PDF emailed successfully to ${recipientEmail}!`);
      return true;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      window.alert(`Email failed: ${errorMessage}`);
      throw error;
    }
  };

  // Save to Shared Folder function
  const saveToSharedFolder = async (item: InFlightItem) => {
    try {
      const PDF_SERVER_URL = process.env.REACT_APP_PDF_SERVER_URL || 'https://dc-analytics01.uct.local';
      
      // Get survey structure and progress (same as PDF generation)
      const surveyResponse = await fetchData(`/getSurvey?surveyId=${item.postId}`);
      const progressResponse = await fetchData(`/getProgress?postId=${item.postId}`);
      const progressData = progressResponse?.data || [];
      
      let surveyData = {};
      progressData.forEach((progress: any) => {
        if (progress.isCompleted && progress.pageData) {
          surveyData = { ...surveyData, ...progress.pageData };
        }
      });
      
      const surveyJson = JSON.parse(surveyResponse.data.json);
      
      const metadata: PDFMetadata = {
        title: `${item.surveyName} (In Progress)`,
        systemName: 'Checklist Manager System',
        organizationName: 'UCT',
        logo: '',
        additionalInfo: `Generated for user: ${item.lastEditedBy} - Progress: ${item.completedPages}/${item.totalPages} pages`,
        showMetadata: true
      };
      
      const requestData = {
        surveyJson: surveyJson,
        surveyData: surveyData,
        metadata: metadata,
        fileName: `${item.surveyName.replace(/[^a-zA-Z0-9]/g, '_')}-InProgress-${item.lastEditedBy}-${new Date().toISOString().split('T')[0]}.pdf`,
        userId: item.lastEditedBy
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
  const handleGeneratePDF = async (item: InFlightItem) => {
    if (isGeneratingPDF === item.postId) return;
    
    setIsGeneratingPDF(item.postId);
    try {
      await generateUniversalPDF(item);
    } catch (error) {
      // Error already handled in the function
    } finally {
      setIsGeneratingPDF(null);
      setOpenDropdowns(new Set());
    }
  };

  const handleEmailPDF = async (item: InFlightItem) => {
    if (isEmailingPDF === item.postId) return;
    
    setIsEmailingPDF(item.postId);
    try {
      await emailPDF(item);
    } catch (error) {
      // Error already handled in the function
    } finally {
      setIsEmailingPDF(null);
      setOpenDropdowns(new Set());
    }
  };

  const handleSaveToSharedFolder = async (item: InFlightItem) => {
    if (isSavingToSharedFolder === item.postId) return;
    
    setIsSavingToSharedFolder(item.postId);
    try {
      await saveToSharedFolder(item);
    } catch (error) {
      // Error already handled in the function
    } finally {
      setIsSavingToSharedFolder(null);
      setOpenDropdowns(new Set());
    }
  };

  const handleResumeChecklist = (item: InFlightItem) => {
    const queryParams = new URLSearchParams({
      load_existing: 'true',
      resume_progress: 'true'
    });
    
    window.location.href = `/run/${item.postId}?${queryParams.toString()}`;
  };

  const handleDeleteProgress = async (item: InFlightItem) => {
    const confirmed = window.confirm(`Are you sure you want to delete the progress for "${item.surveyName}"? This action cannot be undone.`);
    if (confirmed) {
      try {
        await postData("/clearProgress", {
          postId: item.postId,
          userId: item.lastEditedBy
        }, false);
        
        // Refresh the list
        getInFlightChecklists();
        setOpenDropdowns(new Set());
        alert('Progress deleted successfully.');
      } catch (error) {
        Logger.error("Error deleting progress:", error);
        alert('Failed to delete progress. Please try again.');
      }
    }
  };

  const toggleDropdown = (postId: string) => {
    const newOpenDropdowns = new Set(openDropdowns);
    if (newOpenDropdowns.has(postId)) {
      newOpenDropdowns.delete(postId);
    } else {
      newOpenDropdowns.clear(); // Close other dropdowns
      newOpenDropdowns.add(postId);
    }
    setOpenDropdowns(newOpenDropdowns);
  };

  const getInFlightChecklists = async () => {
    try {
      setIsLoading(true);
      const response = await fetchData("/getInFlightChecklists");
      
      // Ensure we always get an array
      const data = response?.data;
      if (Array.isArray(data)) {
        setInFlightChecklists(data);
      } else {
        console.warn("Expected array from /getInFlightChecklists, got:", typeof data, data);
        setInFlightChecklists([]);
      }
    } catch (error) {
      Logger.error("Error getting in-flight checklists:", error);
      console.error("Full error details:", error);
      setInFlightChecklists([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getInFlightChecklists();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenDropdowns(new Set());
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const getProgressPercentage = (completed: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  };

  const getProgressBarColor = (percentage: number) => {
    if (percentage < 25) return 'bg-red-500';
    if (percentage < 50) return 'bg-yellow-500';
    if (percentage < 75) return 'bg-blue-500';
    return 'bg-green-500';
  };

  if (isLoading) {
    return (
      <Layout fullWidth={true}>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading in-flight checklists...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout fullWidth={true}>
      <div style={{ padding: '20px' }}>
        <h1 style={{ textAlign: "center", marginBottom: '20px' }}>
          In Flight Checklists
        </h1>
        
        {/* Custom In Flight Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">
                In Progress Checklists
              </h3>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={getInFlightChecklists}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Refresh
                </button>
                <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors">
                  CSV
                </button>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Checklist Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Edited By</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Page</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Array.isArray(inFlightChecklists) && inFlightChecklists.map((item) => {
                  const isDropdownOpen = openDropdowns.has(item.postId);
                  const progressPercentage = getProgressPercentage(item.completedPages, item.totalPages);
                  const progressBarColor = getProgressBarColor(progressPercentage);
                  
                  return (
                    <tr key={item.postId} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleDropdown(item.postId);
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
                                  onClick={() => handleResumeChecklist(item)}
                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                >
                                  <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m-6-4h8m-6 4h8M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z"></path>
                                  </svg>
                                  Resume Checklist
                                </button>
                                
                                <hr className="my-1 border-gray-200" />
                                
                                <button
                                  onClick={() => handleGeneratePDF(item)}
                                  disabled={isGeneratingPDF === item.postId}
                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                  </svg>
                                  {isGeneratingPDF === item.postId ? 'Generating...' : 'Download PDF (Progress)'}
                                </button>
                                
                                <button
                                  onClick={() => handleEmailPDF(item)}
                                  disabled={isEmailingPDF === item.postId}
                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                                  </svg>
                                  {isEmailingPDF === item.postId ? 'Sending...' : 'Email PDF (Progress)'}
                                </button>
                                
                                <button
                                  onClick={() => handleSaveToSharedFolder(item)}
                                  disabled={isSavingToSharedFolder === item.postId}
                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4-1v8m0 0l3-3m-3 3L9 8m-5 5h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H17M13 13h8m0 0V9m0 4l-3-3"></path>
                                  </svg>
                                  {isSavingToSharedFolder === item.postId ? 'Saving...' : 'Save to Shared Folder'}
                                </button>
                                
                                <hr className="my-1 border-gray-200" />
                                
                                <button
                                  onClick={() => handleDeleteProgress(item)}
                                  className="w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50 flex items-center"
                                >
                                  <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                  </svg>
                                  Delete Progress
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {item.surveyName}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3">
                            <div 
                              className={`h-2 rounded-full ${progressBarColor}`}
                              style={{ width: `${progressPercentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600">
                            {item.completedPages}/{item.totalPages} ({progressPercentage}%)
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.lastEditedBy}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(item.lastUpdated).toLocaleString()}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        Page {item.currentPageNo + 1} of {item.totalPages}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {inFlightChecklists.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No in-flight checklists found. Start a checklist and save some pages to see them here.
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default InFlight;