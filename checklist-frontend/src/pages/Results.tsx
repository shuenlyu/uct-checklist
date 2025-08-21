import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { Model } from "survey-core";
import Layout from "../components/Layout";
import Viewer from "../components/Viewer";
import { useApi } from "../utils/api";
import Logger from "../utils/logger";

// Global window interface for PDF functions
declare global {
  interface Window {
    generateUniversalPDF: () => Promise<void>;
    emailPDF: () => Promise<void>;
    saveToSharedFolder: () => Promise<void>;
  }
}

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
  const [selectedResult, setSelectedResult] = useState<ResultItem | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isEmailingPDF, setIsEmailingPDF] = useState(false);
  const [isSavingToSharedFolder, setIsSavingToSharedFolder] = useState(false);

  // PDF Generation function adapted for Results page
  const generateUniversalPDF = async (resultData: ResultItem) => {
    try {
      Logger.info("🚀 Starting Universal PDF generation from results...");
      
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
      
      Logger.info("📤 Sending data to Universal PDF Generator:", {
        surveyTitle: survey.name,
        dataKeys: Object.keys(surveyData),
        submittedBy: resultData.submittedBy
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
  };

  // Email PDF function
  const emailPDF = async (resultData: ResultItem) => {
    try {
      Logger.info("📧 Starting Email PDF from results...");
      
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
      
      const recipientEmail = window.prompt('Enter recipient email address:');
      if (!recipientEmail) {
        Logger.info("Email cancelled by user");
        return;
      }
      
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
  };

  // Save to Shared Folder function
  const saveToSharedFolder = async (resultData: ResultItem) => {
    try {
      Logger.info("💾 Starting Save to Shared Folder from results...");
      
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
  };

  // Handler functions with loading states
  const handleGeneratePDF = async (resultData: ResultItem) => {
    if (isGeneratingPDF) return;
    
    setIsGeneratingPDF(true);
    try {
      await generateUniversalPDF(resultData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      const usesFallback = window.confirm(
        `PDF generation failed: ${errorMessage}\n\nWould you like to try again?`
      );
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleEmailPDF = async (resultData: ResultItem) => {
    if (isEmailingPDF) return;
    
    setIsEmailingPDF(true);
    try {
      await emailPDF(resultData);
    } catch (error) {
      // Error handling is done within the function
    } finally {
      setIsEmailingPDF(false);
    }
  };

  const handleSaveToSharedFolder = async (resultData: ResultItem) => {
    if (isSavingToSharedFolder) return;
    
    setIsSavingToSharedFolder(true);
    try {
      await saveToSharedFolder(resultData);
    } catch (error) {
      // Error handling is done within the function
    } finally {
      setIsSavingToSharedFolder(false);
    }
  };

  const getSurvey = async () => {
    try {
      const response = await fetchData("/getSurvey?surveyId=" + id);
      setSurvey(response.data);
    } catch (error) {
      Logger.error("❌ Error getting survey:", error);
    }
  };

  const getResults = async () => {
    try {
      const response = await fetchData("/results?postId=" + id);
      setResults(response.data);
      
      // Set the first result as selected by default if available
      if (response.data.length > 0) {
        setSelectedResult(response.data[0]);
      }
    } catch (error) {
      Logger.error("❌ Error getting results:", error);
    }
  };

  useEffect(() => {
    getSurvey();
    getResults();
  }, []);

  // Action buttons component
  const ActionButtons = ({ resultData }: { resultData: ResultItem }) => (
    <div className="flex flex-col sm:flex-row gap-3 mt-6 p-4 bg-gray-50 rounded-lg border">
      <div className="flex-1">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">
          PDF Actions for: {resultData.submittedBy}
        </h3>
        <p className="text-xs text-gray-500 mb-3">
          Submitted: {new Date(resultData.createdAt).toLocaleString()}
        </p>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
        <button
          onClick={() => handleGeneratePDF(resultData)}
          disabled={isGeneratingPDF}
          className={`inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 ${
            isGeneratingPDF ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          {isGeneratingPDF ? 'Generating...' : 'Download PDF'}
        </button>
        
        <button
          onClick={() => handleEmailPDF(resultData)}
          disabled={isEmailingPDF}
          className={`inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 ${
            isEmailingPDF ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
          </svg>
          {isEmailingPDF ? 'Sending...' : 'Email PDF'}
        </button>
        
        <button
          onClick={() => handleSaveToSharedFolder(resultData)}
          disabled={isSavingToSharedFolder}
          className={`inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 ${
            isSavingToSharedFolder ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4-1v8m0 0l3-3m-3 3L9 8m-5 5h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H17M13 13h8m0 0V9m0 4l-3-3"></path>
          </svg>
          {isSavingToSharedFolder ? 'Saving...' : 'Save to Shared Folder'}
        </button>
      </div>
    </div>
  );

  // Results selector component
  const ResultSelector = () => (
    <div className="mb-6 p-4 bg-white rounded-lg border shadow-sm">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">Select Result to Generate PDF</h3>
      <div className="grid gap-2">
        {results.map((result) => (
          <div
            key={result.id}
            className={`p-3 rounded-lg border cursor-pointer transition-colors duration-200 ${
              selectedResult?.id === result.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => setSelectedResult(result)}
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium text-gray-800">
                  Submitted by: <span className="text-blue-600">{result.submittedBy}</span>
                </p>
                <p className="text-sm text-gray-500">
                  {new Date(result.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center">
                {selectedResult?.id === result.id && (
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {results.length === 0 && (
        <p className="text-gray-500 text-center py-4">No results found for this checklist.</p>
      )}
    </div>
  );
  
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
        
        {/* Results Selector */}
        <ResultSelector />
        
        {/* PDF Action Buttons */}
        {selectedResult && (
          <ActionButtons resultData={selectedResult} />
        )}
        
        {/* Viewer Component */}
        <div className="sjs-results-container" style={{ width: '100%', marginTop: '20px' }}>
          <Viewer id={id as string} />
        </div>
      </div>
    </Layout>
  );
};

export default Results;