// src/pages/Run.tsx - jsPDF Implementation for Universal PDF Generation
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
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useApi } from "../utils/api";
import { themes } from "../utils/themeOptions";
import Logger from "../utils/logger";
import Loading from "../components/Loading";
import ThemeSelector from "../components/ThemeSelector";
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

// Professional PDF generator for SurveyJS models
const generateProfessionalPDF = (model: Model, id?: string | null, userId?: string | null) => {
  try {
    Logger.info("Generating professional PDF...");

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPosition = 30;

    // Helper function to add text with word wrapping
    const addWrappedText = (text: string, x: number, y: number, maxWidth: number, fontSize: number = 12) => {
      doc.setFontSize(fontSize);
      const lines = doc.splitTextToSize(text, maxWidth);
      doc.text(lines, x, y);
      return y + (lines.length * fontSize * 0.35); // Return new Y position
    };

    // Header
    doc.setFontSize(22);
    doc.setTextColor(44, 62, 80);
    doc.text('Survey Report', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 20;

    // Survey metadata
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    if (userId && userId !== "noname") {
      doc.text(`Completed by: ${userId}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;
    } else {
      yPosition += 10;
    }

    // Line separator
    doc.setDrawColor(200, 200, 200);
    doc.line(20, yPosition, pageWidth - 20, yPosition);
    yPosition += 20;

    // Get survey data
    const surveyData = model.data;
    const questions = model.getAllQuestions();

    if (Object.keys(surveyData).length === 0) {
      doc.setFontSize(14);
      doc.setTextColor(150, 150, 150);
      doc.text('No survey data available', pageWidth / 2, yPosition, { align: 'center' });
    } else {
      // Prepare data for table
      const tableData: any[] = [];

      // Process each question and its answer
      for (const [key, value] of Object.entries(surveyData)) {
        if (value !== null && value !== undefined && value !== '') {
          // Find the corresponding question to get the title
          const question = questions.find(q => q.name === key);
          const questionTitle = question?.title || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

          let displayValue = '';

          if (typeof value === 'object' && value !== null) {
            if (Array.isArray(value)) {
              displayValue = value.join(', ');
            } else {
              displayValue = JSON.stringify(value, null, 2)
                .replace(/[{}"\[\]]/g, '')
                .replace(/,/g, ', ')
                .replace(/\n\s*/g, ' ')
                .trim();
            }
          } else {
            displayValue = String(value);
          }

          // Limit the display value length for better formatting
          if (displayValue.length > 100) {
            displayValue = displayValue.substring(0, 97) + '...';
          }

          tableData.push([questionTitle, displayValue]);
        }
      }

      if (tableData.length > 0) {
        // Add survey responses table
        doc.setFontSize(16);
        doc.setTextColor(44, 62, 80);
        doc.text('Survey Responses', 20, yPosition);
        yPosition += 10;

        autoTable(doc, {
          head: [['Question', 'Response']],
          body: tableData,
          startY: yPosition,
          theme: 'grid',
          headStyles: {
            fillColor: [52, 73, 94],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 11
          },
          bodyStyles: {
            fontSize: 10,
            cellPadding: 8
          },
          columnStyles: {
            0: { cellWidth: 70, fontStyle: 'bold' },
            1: { cellWidth: 110 }
          },
          alternateRowStyles: {
            fillColor: [245, 245, 245]
          },
          margin: { left: 20, right: 20 },
          tableWidth: 'auto',
          styles: {
            overflow: 'linebreak',
            cellWidth: 'wrap'
          }
        });
      } else {
        doc.setFontSize(14);
        doc.setTextColor(150, 150, 150);
        doc.text('No valid survey responses found', pageWidth / 2, yPosition, { align: 'center' });
      }
    }

    // Footer
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Page ${i} of ${totalPages}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const filename = `survey-report-${id || 'unknown'}-${timestamp}.pdf`;

    // Save the PDF
    doc.save(filename);
    Logger.info(`Professional PDF generated successfully: ${filename}`);

  } catch (error) {
    Logger.error("Professional PDF generation failed:", error);
    throw error;
  }
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

// Universal PDF generation function
// Replace generateUniversalPDF function in Run.tsx with this TypeScript-safe version:
async function generateUniversalPDF(surveyModel: Model, userId: string, surveyName: string = 'Survey') {
  try {
    Logger.info("Starting Universal PDF generation...");

    const PDF_SERVER_URL = process.env.REACT_APP_PDF_SERVER_URL || 'https://dc-analytics01.uct.local';

    const surveyJson = surveyModel.toJSON();
    const surveyData = surveyModel.data;
<<<<<<< HEAD

    // ENHANCED: Get ALL survey data including photos
    Logger.info("=== COMPREHENSIVE DATA COLLECTION ===");
    Logger.info("Basic survey data:", surveyData);

    const enhancedSurveyData = { ...surveyData };

    // Strategy 1: Get all questions including template questions
    const allQuestions = surveyModel.getAllQuestions();
    Logger.info("All questions count:", allQuestions.length);

    allQuestions.forEach(question => {
      const questionName = question.name;
      const questionValue = question.value;

=======
    
    Logger.info("=== COMPLETE DEBUGGING SESSION ===");
    Logger.info("1. Basic survey data:", surveyData);
    Logger.info("2. Survey data keys:", Object.keys(surveyData));
    
    // Enhanced data collection
    const enhancedSurveyData = { ...surveyData };
    
    // COMPREHENSIVE: Get ALL possible data from survey model
    Logger.info("3. Getting all questions...");
    const allQuestions = surveyModel.getAllQuestions();
    Logger.info("   All questions count:", allQuestions.length);
    
    allQuestions.forEach((question: any, index: number) => {
      const questionName = question.name;
      const questionValue = question.value;
      const questionType = question.getType();
      
      Logger.info(`   Question ${index + 1}: "${questionName}" (${questionType}) =`, 
        typeof questionValue === 'string' && questionValue.length > 50 
          ? `${typeof questionValue} (${questionValue.length} chars) "${questionValue.substring(0, 50)}..."` 
          : questionValue
      );
      
>>>>>>> 32df370 (added debugging)
      if (questionValue !== undefined && questionValue !== null) {
        enhancedSurveyData[questionName] = questionValue;
      }
    });
<<<<<<< HEAD

    // Strategy 2: Get plain data (includes template data)
    const plainData = surveyModel.getPlainData({ includeEmpty: true });
    Logger.info("Plain data items:", plainData.length);

    plainData.forEach(item => {
      if (item.name && item.value !== undefined && item.value !== null) {
        enhancedSurveyData[item.name] = item.value;
        Logger.info(`Added from plain data: ${item.name} = ${typeof item.value === 'string' && item.value.length > 50 ? item.value.substring(0, 50) + '...' : item.value}`);
      }
    });

    // Strategy 3: Specifically look for myImageLink
=======
    
    // DIRECT: Try to access myImageLink directly from survey model
    Logger.info("4. Direct myImageLink access attempts:");
    
    // Method 1: Direct question lookup
>>>>>>> 32df370 (added debugging)
    const myImageLinkQuestion = surveyModel.getQuestionByName('myImageLink');
    Logger.info("   Method 1 - getQuestionByName('myImageLink'):", myImageLinkQuestion ? myImageLinkQuestion.value : 'NOT FOUND');
    if (myImageLinkQuestion && myImageLinkQuestion.value) {
      enhancedSurveyData.myImageLink = myImageLinkQuestion.value;
    }
<<<<<<< HEAD

    // Strategy 4: Search all possible image field names
    const imageFieldNames = [
      'myImageLink', 'myimagelink', 'MyImageLink',
      'photo', 'image', 'picture', 'signature',
      'panel1_photo', 'panel1_image', 'panel1_myImageLink'
    ];

    imageFieldNames.forEach(fieldName => {
      const question = surveyModel.getQuestionByName(fieldName);
      if (question && question.value) {
        enhancedSurveyData[fieldName] = question.value;
        Logger.info(`📷 Added image field ${fieldName}: ${question.value.substring(0, 50)}...`);
      }
    });

    Logger.info("=== FINAL ENHANCED SURVEY DATA ===");
    Logger.info("Enhanced survey data keys:", Object.keys(enhancedSurveyData));

    // Log each field to see what we're sending
    for (const [key, value] of Object.entries(enhancedSurveyData)) {
      if (typeof value === 'string' && value.startsWith('data:image')) {
        Logger.info(`📷 IMAGE DATA - ${key}: data:image... (${value.length} chars)`);
      } else if (typeof value === 'string' && value.length > 100) {
        Logger.info(`${key}: ${typeof value} (${value.length} chars) "${value.substring(0, 50)}..."`);
      } else {
        Logger.info(`${key}:`, typeof value, value);
=======
    
    // Method 2: Check survey model internal data
    Logger.info("   Method 2 - surveyModel internal data:");
    try {
      const internalData = (surveyModel as any).data || {};
      Logger.info("     Internal data keys:", Object.keys(internalData));
      if (internalData.myImageLink) {
        enhancedSurveyData.myImageLink = internalData.myImageLink;
        Logger.info("     ✅ Found myImageLink in internal data!");
      }
    } catch (e) {
      Logger.info("     ❌ Could not access internal data");
    }
    
    // Method 3: Check all pages and elements (FIXED TypeScript)
    Logger.info("   Method 3 - Searching survey JSON structure:");
    if (surveyJson.pages) {
      surveyJson.pages.forEach((page: any, pageIndex: number) => {
        Logger.info(`     Page ${pageIndex + 1}:`, page.name || 'unnamed');
        if (page.elements) {
          page.elements.forEach((element: any, elementIndex: number) => {
            Logger.info(`       Element ${elementIndex + 1}: "${element.name}" (${element.type})`);
            
            // If it's myImageLink element, try to get its value
            if (element.name === 'myImageLink') {
              const question = surveyModel.getQuestionByName(element.name);
              if (question && question.value) {
                enhancedSurveyData.myImageLink = question.value;
                Logger.info("       ✅ Found myImageLink via page element!");
              }
            }
            
            // Check panel elements
            if (element.type === 'panel' && element.elements) {
              element.elements.forEach((panelElement: any, panelIndex: number) => {
                Logger.info(`         Panel Element ${panelIndex + 1}: "${panelElement.name}" (${panelElement.type})`);
                if (panelElement.name === 'myImageLink') {
                  const question = surveyModel.getQuestionByName(panelElement.name);
                  if (question && question.value) {
                    enhancedSurveyData.myImageLink = question.value;
                    Logger.info("         ✅ Found myImageLink via panel element!");
                  }
                }
              });
            }
          });
        }
      });
    }
    
    // Method 4: Plain data
    Logger.info("   Method 4 - Plain data:");
    const plainData = surveyModel.getPlainData({ includeEmpty: true });
    Logger.info("     Plain data count:", plainData.length);
    plainData.forEach((item: any, index: number) => {
      Logger.info(`     Plain item ${index + 1}: "${item.name}" =`, 
        typeof item.value === 'string' && item.value.length > 50 
          ? `${typeof item.value} (${item.value.length} chars) "${item.value.substring(0, 50)}..."` 
          : item.value
      );
      
      if (item.name && item.value !== undefined && item.value !== null) {
        enhancedSurveyData[item.name] = item.value;
        if (item.name === 'myImageLink') {
          Logger.info("     ✅ Found myImageLink in plain data!");
        }
      }
    });
    
    // Method 5: Global window search (last resort)
    Logger.info("   Method 5 - Global window search:");
    try {
      const windowSurvey = (window as any).survey;
      if (windowSurvey) {
        Logger.info("     Found window.survey");
        const windowMyImageLink = windowSurvey.getQuestionByName?.('myImageLink');
        if (windowMyImageLink && windowMyImageLink.value) {
          enhancedSurveyData.myImageLink = windowMyImageLink.value;
          Logger.info("     ✅ Found myImageLink via window.survey!");
        }
>>>>>>> 32df370 (added debugging)
      }
    } catch (e) {
      Logger.info("     ❌ No window.survey found");
    }
    
    // FINAL: Manual addition for testing (if you know the field exists)
    Logger.info("5. Final check - what we have so far:");
    Logger.info("   Enhanced data keys:", Object.keys(enhancedSurveyData));
    
    // Check if we found myImageLink anywhere
    if (enhancedSurveyData.myImageLink) {
      Logger.info("   ✅ SUCCESS! myImageLink found:", enhancedSurveyData.myImageLink.substring(0, 50) + '...');
    } else {
      Logger.warn("   ❌ FAILED! myImageLink not found anywhere!");
      Logger.warn("   This means myImageLink might not be a survey question or might be stored differently.");
      
      // MANUAL FIX: If you can see myImageLink in your browser dev tools, 
      // we can manually add it here for testing
      Logger.warn("   🔧 MANUAL FIX ATTEMPT:");
      
      // Try to access it from DOM or other sources
      try {
        // Check if there's a file input or image element with myImageLink
        const imageElements = document.querySelectorAll('input[type="file"], img, canvas');
        Logger.info("     Found image-related elements:", imageElements.length);
        
        imageElements.forEach((element: Element, index: number) => {
          Logger.info(`     Element ${index + 1}:`, element.tagName, (element as any).id, element.className);
          
          // If it's a file input, check its files
          if (element.tagName === 'INPUT' && (element as HTMLInputElement).files) {
            const files = (element as HTMLInputElement).files;
            if (files && files.length > 0) {
              Logger.info(`       Has ${files.length} files`);
              // This would need additional processing to convert to base64
            }
          }
        });
      } catch (e) {
        Logger.info("     ❌ Could not search DOM elements");
      }
    }
    
    // FOR TESTING: If myImageLink is still not found, add a placeholder
    if (!enhancedSurveyData.myImageLink) {
      Logger.warn("   🚨 TESTING MODE: Adding placeholder message");
      enhancedSurveyData.myImageLink = "PLACEHOLDER - myImageLink not captured from survey model";
    }

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
<<<<<<< HEAD

    Logger.info("Sending to PDF server - surveyData keys:", Object.keys(requestData.surveyData));

=======
    
    Logger.info("=== FINAL REQUEST DATA ===");
    Logger.info("Survey data being sent to PDF server:");
    for (const [key, value] of Object.entries(requestData.surveyData)) {
      if (typeof value === 'string' && value.startsWith('data:image')) {
        Logger.info(`  ${key}: 📷 IMAGE DATA (${value.length} chars)`);
      } else if (typeof value === 'string' && value.length > 50) {
        Logger.info(`  ${key}: ${typeof value} (${value.length} chars) "${value.substring(0, 50)}..."`);
      } else {
        Logger.info(`  ${key}:`, typeof value, value);
      }
    }
    
>>>>>>> 32df370 (added debugging)
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

    const PDF_SERVER_URL = process.env.REACT_APP_PDF_SERVER_URL || 'https://dc-analytics01.uct.local';

    const surveyJson = surveyModel.toJSON();
    const surveyData = surveyModel.data;

    // Use the same enhanced data collection
    const enhancedSurveyData = { ...surveyData };
    const allQuestions = surveyModel.getAllQuestions();

    allQuestions.forEach(question => {
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
      surveyData: enhancedSurveyData, // Use enhanced data
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

    const PDF_SERVER_URL = process.env.REACT_APP_PDF_SERVER_URL || 'https://dc-analytics01.uct.local';

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

  // SurveyJS PDF Generator - Simplified to match working example exactly
  const generateSurveyPDF = async (model: Model) => {
    if (isGeneratingPDF) {
      Logger.info("PDF generation already in progress, skipping...");
      return;
    }

    try {
      setIsGeneratingPDF(true);
      Logger.info("Starting jsPDF survey PDF generation...");

      // Use the new jsPDF implementation
      generateProfessionalPDF(model, id, userId);

    } catch (error) {
      Logger.error("Survey PDF generation failed:", error);
      alert(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                <span>Download PDF</span>
              </button>
            </div>
          </div>
        `;

        // Make PDF generation available from completion page
        (window as any).generateCompletionPDF = async () => {
          Logger.info("jsPDF generation triggered from completion page");
          const btn = document.getElementById('completionPdfBtn');
          if (btn) {
            btn.innerHTML = '<span class="inline-flex items-center"><svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Generating PDF...</span>';
            btn.setAttribute('disabled', 'true');
          }

          try {
            generateProfessionalPDF(sender, id, userId);
          } catch (error) {
            Logger.error("Completion PDF generation failed:", error);
            alert("PDF generation failed. Please try the PDF button in the toolbar instead.");
          }

          if (btn) {
            btn.innerHTML = '<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg><span>Download PDF</span>';
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
                title="Generate Professional PDF with jsPDF"
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
                    Generate PDF
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
