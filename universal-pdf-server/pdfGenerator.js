// universalSurveyJSPdfGenerator.js - Fully Generalized PDF Generator for Any SurveyJS Form
// 
// INSTALLATION:
// npm install puppeteer express cors fs path sharp jimp nodemailer @azure/msal-node axios form-data
//
// This generator automatically handles ALL SurveyJS question types and layouts without custom code
//
require('dotenv').config();

const puppeteer = require('puppeteer');
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');


const app = express();
const PORT = process.env.PDF_SERVER_PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Create directories
const uploadsDir = path.join(__dirname, 'uploads');
const tempDir = path.join(__dirname, 'temp');
[uploadsDir, tempDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// ============================
// UNIVERSAL SURVEY PROCESSOR
// ============================


class UniversalSurveyProcessor {
    constructor() {
        this.questionTypeHandlers = new Map();
        this.layoutDetectors = [];
        this.metadataExtractors = [];
        this.setupDefaultHandlers();
    }

    setupDefaultHandlers() {
        // Register all SurveyJS question type handlers
        const questionTypes = [
            'text', 'comment', 'radiogroup', 'checkbox', 'dropdown', 'tagbox',
            'rating', 'ranking', 'imagepicker', 'boolean', 'matrix', 'matrixdropdown',
            'matrixdynamic', 'multipletext', 'file', 'signaturepad', 'image',
            'html', 'expression', 'panel', 'paneldynamic', 'flowpanel'
        ];

        questionTypes.forEach(type => {
            this.questionTypeHandlers.set(type, this.getQuestionHandler(type));
        });

        // Register layout detectors
        this.layoutDetectors = [
            this.detectTableLayout.bind(this),
            this.detectFormLayout.bind(this),
            this.detectCardLayout.bind(this),
            this.detectListLayout.bind(this)
        ];

        // Register metadata extractors
        this.metadataExtractors = [
            this.extractFromQuestionNames.bind(this),
            this.extractFromPanelData.bind(this),
            this.extractFromSurveyTitle.bind(this),
            this.extractFromCustomFields.bind(this)
        ];
    }

    // ============================
    // MAIN PROCESSING METHODS
    // ============================

    processSurvey(surveyJson, surveyData, metadata = {}) {
        console.log('🔄 Processing survey with Universal Processor...');
        
        // Extract metadata automatically
        const extractedMetadata = this.extractMetadata(surveyJson, surveyData);
        const finalMetadata = { ...extractedMetadata, ...metadata };

        // Detect optimal layout
        const layout = this.detectLayout(surveyJson, surveyData);
        console.log(`📊 Detected layout: ${layout.type}`);

        // Generate HTML content
        const htmlContent = this.generateHTML(surveyJson, surveyData, finalMetadata, layout);
        
        return htmlContent;
    }

    // ============================
    // METADATA EXTRACTION
    // ============================

    extractMetadata(surveyJson, surveyData) {
        const metadata = {
            title: surveyJson.title || 'Survey Results',
            fields: [],
            extractedAt: new Date().toISOString()
        };

        // Run all metadata extractors
        for (const extractor of this.metadataExtractors) {
            try {
                const extracted = extractor(surveyJson, surveyData);
                if (extracted.fields && extracted.fields.length > 0) {
                    metadata.fields.push(...extracted.fields);
                }
                if (extracted.title && !metadata.title) {
                    metadata.title = extracted.title;
                }
            } catch (error) {
                console.warn('⚠️  Metadata extractor failed:', error.message);
            }
        }

        // Remove duplicates
        metadata.fields = this.removeDuplicateFields(metadata.fields);
        
        console.log(`📋 Extracted ${metadata.fields.length} metadata fields`);
        return metadata;
    }

    extractFromQuestionNames(surveyJson, surveyData) {
        const commonFieldMappings = [
            { patterns: ['station', 'workstation'], label: 'Station' },
            { patterns: ['workorder', 'work_order', 'work-order'], label: 'Work Order' },
            { patterns: ['toolid', 'tool_id', 'tool-id'], label: 'Tool ID' },
            { patterns: ['date', 'inspection_date', 'inspectiondate'], label: 'Date' },
            { patterns: ['shift'], label: 'Shift' },
            { patterns: ['department'], label: 'Department' },
            { patterns: ['line', 'production_line'], label: 'Line' },
            { patterns: ['oms', 'oms_sn'], label: 'OMS' },
            { patterns: ['step'], label: 'Step' },
            { patterns: ['plant_code', 'plantcode'], label: 'Plant Code' },
            { patterns: ['user_id', 'userid'], label: 'User ID' },
            { patterns: ['sn', 'serial_number', 'serialnumber'], label: 'Serial Number' },
            { patterns: ['part_number', 'partnumber', 'machine_part_number'], label: 'Part Number' },
            { patterns: ['po_number', 'ponumber', 'customer_po'], label: 'PO Number' },
            { patterns: ['operator'], label: 'Operator' }
        ];

        // Fields to exclude from metadata (signatures, images, large text, etc.)
        const excludePatterns = [
            'signature', 'sign', 'photo', 'image', 'file', 'comment', 'notes', 
            'description', 'html', 'data:image', 'base64'
        ];

        const fields = [];
        
        // Search through all survey data
        for (const [key, value] of Object.entries(surveyData)) {
            // Skip if this looks like signature/image/file data
            if (this.shouldExcludeFromMetadata(key, value, excludePatterns)) {
                continue;
            }

            if (value && typeof value === 'object' && !Array.isArray(value)) {
                // Handle nested objects (like panel data)
                for (const [nestedKey, nestedValue] of Object.entries(value)) {
                    if (this.shouldExcludeFromMetadata(nestedKey, nestedValue, excludePatterns)) {
                        continue;
                    }
                    const field = this.matchFieldPattern(nestedKey, nestedValue, commonFieldMappings);
                    if (field) fields.push(field);
                }
            } else {
                // Handle top-level fields
                const field = this.matchFieldPattern(key, value, commonFieldMappings);
                if (field) fields.push(field);
            }
        }

        return { fields };
    }

    shouldExcludeFromMetadata(key, value, excludePatterns) {
        // Exclude based on key name
        const lowerKey = key.toLowerCase();
        if (excludePatterns.some(pattern => lowerKey.includes(pattern))) {
            return true;
        }

        // Exclude based on value content
        if (typeof value === 'string') {
            // Exclude base64 image data
            if (value.startsWith('data:image') || value.startsWith('data:application')) {
                return true;
            }
            // Exclude very long text (likely comments/descriptions)
            if (value.length > 200) {
                return true;
            }
        }

        // Exclude arrays (likely file uploads or multi-select with many items)
        if (Array.isArray(value) && value.length > 5) {
            return true;
        }

        return false;
    }

    extractFromPanelData(surveyJson, surveyData) {
        const fields = [];
        
        // Look for panels that might contain header information
        if (surveyJson.pages) {
            for (const page of surveyJson.pages) {
                if (page.elements) {
                    for (const element of page.elements) {
                        if (element.type === 'panel' || element.type === 'multipletext') {
                            const panelData = surveyData[element.name];
                            if (panelData && typeof panelData === 'object') {
                                for (const [key, value] of Object.entries(panelData)) {
                                    if (value && value !== '') {
                                        fields.push({
                                            label: this.formatLabel(key),
                                            value: this.formatValue(value),
                                            source: 'panel'
                                        });
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        
        return { fields };
    }

    extractFromSurveyTitle(surveyJson, surveyData) {
        const title = surveyJson.title;
        if (!title) return { fields: [] };

        // Extract information from title patterns
        const fields = [];
        
        // Look for common patterns in title
        const patterns = [
            { regex: /(\w+-\d+-\w+-\d+-\w+)/, label: 'OMS Number' },
            { regex: /Step(\d+)/, label: 'Step' },
            { regex: /(\w+_Step\d+)/, label: 'Process Step' }
        ];

        for (const pattern of patterns) {
            const match = title.match(pattern.regex);
            if (match) {
                fields.push({
                    label: pattern.label,
                    value: match[1] || match[0],
                    source: 'title'
                });
            }
        }

        return { fields, title };
    }

    extractFromCustomFields(surveyJson, surveyData) {
        // Extract from any custom question types or special naming conventions
        const fields = [];
        
        // Look for datacollection_header type questions
        for (const [key, value] of Object.entries(surveyData)) {
            if (key.includes('header') && value && typeof value === 'object') {
                for (const [headerKey, headerValue] of Object.entries(value)) {
                    if (headerValue && headerValue !== '') {
                        fields.push({
                            label: this.formatLabel(headerKey),
                            value: this.formatValue(headerValue),
                            source: 'custom_header'
                        });
                    }
                }
            }
        }

        return { fields };
    }

    // ============================
    // LAYOUT DETECTION
    // ============================

    detectLayout(surveyJson, surveyData) {
        for (const detector of this.layoutDetectors) {
            const layout = detector(surveyJson, surveyData);
            if (layout) {
                return layout;
            }
        }
        
        // Default layout
        return { type: 'standard', config: {} };
    }

    detectTableLayout(surveyJson, surveyData) {
        // Detect if survey has tabular/matrix-heavy content
        let matrixCount = 0;
        let dynamicPanelCount = 0;
        let totalQuestions = 0;

        this.traverseElements(surveyJson, (element) => {
            totalQuestions++;
            if (element.type?.includes('matrix')) matrixCount++;
            if (element.type === 'paneldynamic') dynamicPanelCount++;
        });

        if (matrixCount > totalQuestions * 0.5 || dynamicPanelCount > 0) {
            return {
                type: 'table',
                config: {
                    emphasizeMatrices: true,
                    compactMode: true
                }
            };
        }
        return null;
    }

    detectFormLayout(surveyJson, surveyData) {
        // Detect traditional form layout
        let textInputs = 0;
        let choiceQuestions = 0;
        let totalQuestions = 0;

        this.traverseElements(surveyJson, (element) => {
            totalQuestions++;
            if (['text', 'comment', 'multipletext'].includes(element.type)) textInputs++;
            if (['radiogroup', 'checkbox', 'dropdown'].includes(element.type)) choiceQuestions++;
        });

        if (textInputs > totalQuestions * 0.6) {
            return {
                type: 'form',
                config: {
                    emphasizeLabels: true,
                    standardSpacing: true
                }
            };
        }
        return null;
    }

    detectCardLayout(surveyJson, surveyData) {
        // Detect card-based layout (panels, signatures, images)
        let panelCount = 0;
        let signatureCount = 0;
        let fileCount = 0;
        let totalElements = 0;

        this.traverseElements(surveyJson, (element) => {
            totalElements++;
            if (element.type === 'panel') panelCount++;
            if (element.type === 'signaturepad') signatureCount++;
            if (element.type === 'file') fileCount++;
        });

        if (panelCount > 2 || signatureCount > 0 || fileCount > 0) {
            return {
                type: 'card',
                config: {
                    emphasizeVisuals: true,
                    cardSpacing: true
                }
            };
        }
        return null;
    }

    detectListLayout(surveyJson, surveyData) {
        // Detect simple list layout
        return {
            type: 'list',
            config: {
                simpleLayout: true,
                compactSpacing: true
            }
        };
    }

    // ============================
    // HTML GENERATION
    // ============================

    generateHTML(surveyJson, surveyData, metadata, layout) {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>${metadata.title || 'Survey Results'}</title>
            <style>
                ${this.generateCSS(layout)}
            </style>
        </head>
        <body>
            <div class="pdf-container layout-${layout.type}">
                ${this.generateHeader(metadata)}
                ${this.generateSurveyContent(surveyJson, surveyData, layout)}
                ${this.generateFooter(metadata)}
            </div>
        </body>
        </html>
        `;
    }

    generateCSS(layout) {
        const baseCSS = `
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                background: white;
                font-size: 14px;
            }
            
            .pdf-container {
                max-width: 100%;
                margin: 0;
                padding: 20px;
            }
            
            /* Header Styles */
            .pdf-header {
                text-align: center;
                margin-bottom: 30px;
                padding-bottom: 20px;
                border-bottom: 2px solid #007acc;
                page-break-inside: avoid;
            }
            
            .pdf-title {
                font-size: 24px;
                font-weight: bold;
                color: #007acc;
                margin-bottom: 10px;
            }
            
            .pdf-subtitle {
                font-size: 16px;
                color: #666;
                margin-bottom: 5px;
            }
            
            /* Metadata Section */
            .metadata-section {
                margin-bottom: 30px;
                padding: 20px;
                background: #f8f9fa;
                border-radius: 8px;
                border: 1px solid #e0e0e0;
            }
            
            .metadata-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 20px;
                align-items: start;
            }
            
            .metadata-field {
                display: flex;
                flex-direction: column;
                gap: 5px;
            }
            
            .field-label {
                font-weight: bold;
                color: #333;
                font-size: 14px;
            }
            
            .field-value {
                padding: 8px 12px;
                background: white;
                border: 1px solid #ddd;
                border-radius: 4px;
                min-height: 20px;
                font-size: 14px;
            }
            
            /* Page Styles */
            .survey-page {
                margin-bottom: 40px;
                page-break-before: auto;
            }
            
            .page-title {
                font-size: 20px;
                font-weight: bold;
                color: #007acc;
                margin-bottom: 20px;
                padding-bottom: 10px;
                border-bottom: 1px solid #ddd;
            }
            
            .page-description {
                color: #666;
                margin-bottom: 20px;
                font-style: italic;
            }
            
            /* Question Styles */
            .survey-question {
                margin-bottom: 25px;
                page-break-inside: avoid;
            }
            
            .question-title {
                font-weight: bold;
                font-size: 15px;
                margin-bottom: 10px;
                color: #333;
                line-height: 1.4;
            }
            
            .question-description {
                color: #666;
                font-size: 13px;
                margin-bottom: 10px;
                font-style: italic;
            }
            
            .question-required {
                color: #d73027;
                font-weight: bold;
            }
            
            .question-value {
                background: #fff;
                border: 1px solid #ddd;
                border-radius: 4px;
                padding: 12px;
                min-height: 40px;
                word-wrap: break-word;
            }
            
            .no-response {
                color: #999;
                font-style: italic;
                text-align: center;
                padding: 20px;
                background: #f8f8f8;
                border-radius: 4px;
            }
            
            /* Panel Styles */
            .survey-panel {
                margin-bottom: 25px;
                border: 1px solid #e0e0e0;
                border-radius: 8px;
                overflow: hidden;
                page-break-inside: avoid;
            }
            
            .panel-header {
                background: #f5f5f5;
                padding: 15px;
                border-bottom: 1px solid #e0e0e0;
            }
            
            .panel-title {
                font-size: 18px;
                font-weight: bold;
                color: #333;
            }
            
            .panel-content {
                padding: 20px;
            }
            
            /* Dynamic Panel Styles */
            .dynamic-panel {
                border: 1px solid #ddd;
                border-radius: 6px;
                margin-bottom: 15px;
                overflow: hidden;
            }
            
            .dynamic-panel-header {
                background: #f0f0f0;
                padding: 10px 15px;
                font-weight: bold;
                border-bottom: 1px solid #ddd;
            }
            
            .dynamic-panel-content {
                padding: 15px;
            }
            
            /* Matrix Styles */
            .matrix-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 10px;
                font-size: 13px;
            }
            
            .matrix-table th,
            .matrix-table td {
                border: 1px solid #ddd;
                padding: 10px;
                text-align: left;
                vertical-align: top;
            }
            
            .matrix-table th {
                background: #f5f5f5;
                font-weight: bold;
                color: #333;
            }
            
            .matrix-table tr:nth-child(even) {
                background: #fafafa;
            }
            
            .matrix-cell-selected {
                background: #e3f2fd !important;
                font-weight: bold;
            }
            
            /* Choice Question Styles */
            .question-choices {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            
            .choice-item {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 6px;
            }
            
            .choice-selected {
                background: #e3f2fd;
                border-radius: 4px;
                font-weight: 500;
            }
            
            .choice-marker {
                width: 16px;
                height: 16px;
                border: 2px solid #ddd;
                border-radius: 50%;
                background: white;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
            }
            
            .choice-marker.selected {
                background: #007acc;
                border-color: #007acc;
                color: white;
            }
            
            .choice-marker.checkbox {
                border-radius: 3px;
            }
            
            /* Rating Question Styles */
            .question-rating {
                display: flex;
                align-items: center;
                gap: 15px;
                padding: 10px;
            }
            
            .rating-scale {
                display: flex;
                gap: 5px;
                align-items: center;
            }
            
            .rating-item {
                width: 30px;
                height: 30px;
                border: 2px solid #ddd;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
            }
            
            .rating-item.selected {
                background: #007acc;
                border-color: #007acc;
                color: white;
            }
            
            .rating-labels {
                display: flex;
                justify-content: space-between;
                margin-top: 5px;
                font-size: 12px;
                color: #666;
            }
            
            /* Tag/Ranking Styles */
            .tag-container {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
            }
            
            .tag {
                background: #e3f2fd;
                border: 1px solid #007acc;
                border-radius: 16px;
                padding: 4px 12px;
                font-size: 12px;
                color: #007acc;
            }
            
            .ranking-container {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            
            .rank-item {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 8px;
                background: #f8f9fa;
                border-radius: 4px;
            }
            
            .rank-number {
                width: 24px;
                height: 24px;
                background: #007acc;
                color: white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: 12px;
            }
            
            /* Image Choice Styles */
            .image-choice-container {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 15px;
                margin-top: 10px;
            }
            
            .image-choice {
                text-align: center;
                border: 2px solid #ddd;
                border-radius: 8px;
                padding: 10px;
            }
            
            .image-choice.selected {
                border-color: #007acc;
                background: #e3f2fd;
            }
            
            .image-choice img {
                width: 100%;
                height: 120px;
                object-fit: cover;
                border-radius: 4px;
                margin-bottom: 8px;
            }
            
            /* Expression/Calculated Question Styles */
            .calculated-value {
                background: #e8f5e8;
                border: 1px solid #4caf50;
                color: #2e7d32;
                font-weight: bold;
                text-align: center;
            }
            
            /* Signature Styles */
            .signature-container {
                border: 2px solid #ddd;
                border-radius: 4px;
                padding: 15px;
                text-align: center;
                background: #fafafa;
                margin: 10px 0;
            }
            
            .signature-image {
                max-width: 400px;
                height: auto;
                border: 1px solid #ccc;
                border-radius: 4px;
                background: white;
                padding: 5px;
            }
            
            /* File Upload Styles */
            .file-list {
                display: flex;
                flex-direction: column;
                gap: 15px;
            }
            
            .file-item {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 8px;
                background: #f8f9fa;
                border-radius: 4px;
                border: 1px solid #ddd;
            }
            
            .file-item.image-file {
                flex-direction: column;
                align-items: stretch;
                padding: 15px;
                background: #fff;
                border: 2px solid #007acc;
            }
            
            .file-image-container {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 10px;
            }
            
            .uploaded-image {
                max-width: 400px;
                max-height: 300px;
                width: auto;
                height: auto;
                object-fit: contain;
                border: 1px solid #ccc;
                border-radius: 4px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            
            .image-info {
                text-align: center;
                width: 100%;
            }
            
            .file-name {
                font-size: 14px;
                color: #333;
                margin-bottom: 4px;
            }
            
            .file-details {
                font-size: 12px;
                color: #666;
            }
            
            .file-icon {
                width: 24px;
                height: 24px;
                background: #007acc;
                border-radius: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 12px;
                font-weight: bold;
                flex-shrink: 0;
            }
            
            /* Print-specific styles */
            @media print {
                body {
                    margin: 0;
                    padding: 0;
                }
                
                .pdf-container {
                    padding: 15px;
                }
                
                .survey-page {
                    page-break-before: auto;
                }
                
                .survey-question,
                .survey-panel {
                    page-break-inside: avoid;
                }
            }
        `;

        // Add layout-specific CSS
        let layoutSpecificCSS = '';
        
        switch (layout.type) {
            case 'table':
                layoutSpecificCSS = `
                    .layout-table .survey-question {
                        margin-bottom: 15px;
                    }
                    .layout-table .matrix-table {
                        font-size: 12px;
                    }
                    .layout-table .matrix-table th,
                    .layout-table .matrix-table td {
                        padding: 6px;
                    }
                `;
                break;
            case 'form':
                layoutSpecificCSS = `
                    .layout-form .question-title {
                        font-size: 16px;
                        margin-bottom: 12px;
                    }
                    .layout-form .question-value {
                        padding: 15px;
                    }
                `;
                break;
            case 'card':
                layoutSpecificCSS = `
                    .layout-card .survey-panel {
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                        margin-bottom: 30px;
                    }
                    .layout-card .signature-container {
                        border: 3px solid #007acc;
                    }
                `;
                break;
        }

        return baseCSS + layoutSpecificCSS;
    }

    generateHeader(metadata) {
        const currentDate = new Date().toLocaleDateString();
        const currentTime = new Date().toLocaleTimeString();
        
        let headerHTML = `
            <div class="pdf-header">
                <div class="pdf-title">${metadata.title || 'Survey Results'}</div>
                <div class="pdf-subtitle">Generated on ${currentDate} at ${currentTime}</div>
            </div>
        `;

        // Check if metadata section should be shown
        const showMetadata = metadata.showMetadata !== false; // Default to true unless explicitly disabled
        
        // Only show metadata section if enabled and we have meaningful business fields
        if (showMetadata && metadata.fields && metadata.fields.length > 0) {
            // Filter out generic or less useful fields for header display
            const headerFields = metadata.fields.filter(field => {
                const label = field.label.toLowerCase();
                // Include important business fields
                return ['work order', 'station', 'tool id', 'department', 'shift', 'oms', 'step', 'date'].some(important => 
                    label.includes(important)
                );
            });

            // Only show metadata section if we have good header fields
            if (headerFields.length > 0) {
                const fieldsHTML = headerFields.slice(0, 8).map(field => `
                    <div class="metadata-field">
                        <label class="field-label">${field.label}</label>
                        <div class="field-value">${this.escapeHtml(field.value)}</div>
                    </div>
                `).join('');
                
                headerHTML += `
                    <div class="metadata-section">
                        <div class="metadata-grid">
                            ${fieldsHTML}
                        </div>
                    </div>
                `;
            }
        }

        return headerHTML;
    }

    generateSurveyContent(surveyJson, surveyData, layout) {
        if (!surveyJson) {
            return '<div class="no-response">No survey structure available</div>';
        }

        let html = '';
        
        if (surveyJson.pages && surveyJson.pages.length > 0) {
            surveyJson.pages.forEach((page, pageIndex) => {
                html += this.generatePage(page, surveyData, pageIndex, layout);
            });
        } else if (surveyJson.elements && surveyJson.elements.length > 0) {
            html += `
                <div class="survey-page">
                    ${this.generateElements(surveyJson.elements, surveyData, layout)}
                </div>
            `;
        }

        return html;
    }

    generatePage(page, surveyData, pageIndex, layout) {
        const pageTitle = page.title || page.name || `Page ${pageIndex + 1}`;
        const pageDescription = page.description || '';
        
        return `
            <div class="survey-page">
                ${pageTitle ? `<div class="page-title">${pageTitle}</div>` : ''}
                ${pageDescription ? `<div class="page-description">${pageDescription}</div>` : ''}
                ${this.generateElements(page.elements || [], surveyData, layout)}
            </div>
        `;
    }

    generateElements(elements, surveyData, layout) {
        return elements.map(element => {
            return this.generateElement(element, surveyData, layout);
        }).join('');
    }

    generateElement(element, surveyData, layout) {
        const handler = this.questionTypeHandlers.get(element.type);
        if (handler) {
            return handler(element, surveyData, layout);
        }
        
        // Fallback for unknown question types
        console.warn(`⚠️  Unknown question type: ${element.type}`);
        return this.generateUnknownQuestion(element, surveyData);
    }

    // ============================
    // QUESTION TYPE HANDLERS
    // ============================

    getQuestionHandler(questionType) {
        const handlers = {
            text: (element, surveyData) => this.generateTextQuestion(element, surveyData),
            comment: (element, surveyData) => this.generateCommentQuestion(element, surveyData),
            radiogroup: (element, surveyData) => this.generateRadioGroupQuestion(element, surveyData),
            checkbox: (element, surveyData) => this.generateCheckboxQuestion(element, surveyData),
            dropdown: (element, surveyData) => this.generateDropdownQuestion(element, surveyData),
            tagbox: (element, surveyData) => this.generateTagboxQuestion(element, surveyData),
            rating: (element, surveyData) => this.generateRatingQuestion(element, surveyData),
            ranking: (element, surveyData) => this.generateRankingQuestion(element, surveyData),
            imagepicker: (element, surveyData) => this.generateImagePickerQuestion(element, surveyData),
            boolean: (element, surveyData) => this.generateBooleanQuestion(element, surveyData),
            matrix: (element, surveyData) => this.generateMatrixQuestion(element, surveyData),
            matrixdropdown: (element, surveyData) => this.generateMatrixDropdownQuestion(element, surveyData),
            matrixdynamic: (element, surveyData) => this.generateMatrixDynamicQuestion(element, surveyData),
            multipletext: (element, surveyData) => this.generateMultipleTextQuestion(element, surveyData),
            file: (element, surveyData) => this.generateFileQuestion(element, surveyData),
            signaturepad: (element, surveyData) => this.generateSignatureQuestion(element, surveyData),
            image: (element, surveyData) => this.generateImageQuestion(element, surveyData),
            html: (element, surveyData) => this.generateHtmlQuestion(element, surveyData),
            expression: (element, surveyData) => this.generateExpressionQuestion(element, surveyData),
            panel: (element, surveyData, layout) => this.generatePanel(element, surveyData, layout),
            paneldynamic: (element, surveyData, layout) => this.generateDynamicPanel(element, surveyData, layout),
            flowpanel: (element, surveyData, layout) => this.generateFlowPanel(element, surveyData, layout)
        };

        return handlers[questionType] || ((element, surveyData) => this.generateUnknownQuestion(element, surveyData));
    }

    generateTextQuestion(element, surveyData) {
        const value = surveyData[element.name] || '';
        return this.wrapQuestion(element, `
            <div class="question-value">${this.escapeHtml(value) || '<span class="no-response">No response</span>'}</div>
        `);
    }

    generateCommentQuestion(element, surveyData) {
        const value = surveyData[element.name] || '';
        return this.wrapQuestion(element, `
            <div class="question-value">${this.escapeHtml(value).replace(/\n/g, '<br>') || '<span class="no-response">No response</span>'}</div>
        `);
    }

    generateRadioGroupQuestion(element, surveyData) {
        const value = surveyData[element.name];
        const choices = element.choices || [];
        
        const choicesHtml = choices.map(choice => {
            const choiceValue = typeof choice === 'object' ? choice.value : choice;
            const choiceText = typeof choice === 'object' ? choice.text : choice;
            const isSelected = value === choiceValue;
            
            return `
                <div class="choice-item ${isSelected ? 'choice-selected' : ''}">
                    <div class="choice-marker ${isSelected ? 'selected' : ''}">${isSelected ? '●' : ''}</div>
                    <span>${this.escapeHtml(choiceText)}</span>
                </div>
            `;
        }).join('');
        
        return this.wrapQuestion(element, `
            <div class="question-choices">
                ${choicesHtml || '<div class="no-response">No choices defined</div>'}
            </div>
        `);
    }

    generateCheckboxQuestion(element, surveyData) {
        const value = surveyData[element.name];
        const selectedValues = Array.isArray(value) ? value : (value ? [value] : []);
        const choices = element.choices || [];
        
        const choicesHtml = choices.map(choice => {
            const choiceValue = typeof choice === 'object' ? choice.value : choice;
            const choiceText = typeof choice === 'object' ? choice.text : choice;
            const isSelected = selectedValues.includes(choiceValue);
            
            return `
                <div class="choice-item ${isSelected ? 'choice-selected' : ''}">
                    <div class="choice-marker checkbox ${isSelected ? 'selected' : ''}">${isSelected ? '✓' : ''}</div>
                    <span>${this.escapeHtml(choiceText)}</span>
                </div>
            `;
        }).join('');
        
        return this.wrapQuestion(element, `
            <div class="question-choices">
                ${choicesHtml || '<div class="no-response">No choices defined</div>'}
            </div>
        `);
    }

    generateMultipleTextQuestion(element, surveyData) {
        const value = surveyData[element.name] || {};
        const items = element.items || [];
        
        if (items.length === 0) {
            return this.wrapQuestion(element, '<div class="no-response">No items defined</div>');
        }
        
        const itemsHtml = items.map(item => {
            const itemValue = value[item.name] || '';
            const itemTitle = item.title || item.name;
            
            return `
                <div class="metadata-field" style="margin-bottom: 15px;">
                    <label class="field-label">${this.escapeHtml(itemTitle)}</label>
                    <div class="field-value">${this.escapeHtml(itemValue) || '<span class="no-response">No response</span>'}</div>
                </div>
            `;
        }).join('');
        
        return this.wrapQuestion(element, `
            <div class="metadata-grid" style="grid-template-columns: 1fr;">
                ${itemsHtml}
            </div>
        `);
    }

    generateBooleanQuestion(element, surveyData) {
        const value = surveyData[element.name];
        const isChecked = value === true || value === 'true' || value === 1;
        const labelText = element.label || element.title || 'Yes/No';
        
        return this.wrapQuestion(element, `
            <div class="choice-item ${isChecked ? 'choice-selected' : ''}">
                <div class="choice-marker checkbox ${isChecked ? 'selected' : ''}">${isChecked ? '✓' : ''}</div>
                <span>${this.escapeHtml(labelText)}: ${isChecked ? 'Yes' : 'No'}</span>
            </div>
        `);
    }

    generateSignatureQuestion(element, surveyData) {
        const value = surveyData[element.name];
        
        if (!value) {
            return this.wrapQuestion(element, '<div class="no-response">No signature provided</div>');
        }
        
        if (typeof value === 'string' && value.startsWith('data:image')) {
            return this.wrapQuestion(element, `
                <div class="signature-container">
                    <img src="${value}" alt="Signature" class="signature-image">
                    <div style="margin-top: 8px; font-size: 12px; color: #666;">Digital Signature</div>
                </div>
            `);
        }
        
        return this.wrapQuestion(element, `
            <div class="signature-container">
                <div style="padding: 20px; border: 2px solid #ddd; text-align: center; font-style: italic;">
                    ${this.escapeHtml(value)}
                </div>
            </div>
        `);
    }

    generateFileQuestion(element, surveyData) {
        const value = surveyData[element.name];
        
        if (!value || !Array.isArray(value) || value.length === 0) {
            return this.wrapQuestion(element, '<div class="no-response">No files uploaded</div>');
        }
        
        const filesHtml = value.map(file => {
            const fileName = file.name || 'Unknown file';
            const fileType = file.type || 'Unknown type';
            const fileSize = file.size ? `(${this.formatFileSize(file.size)})` : '';
            const fileExt = fileName.split('.').pop()?.toUpperCase() || 'FILE';
            
            // Check if this is an image file with content
            if (this.isImageFile(file)) {
                // If file has base64 content, display the image
                if (file.content && typeof file.content === 'string' && file.content.startsWith('data:image')) {
                    return `
                        <div class="file-item image-file">
                            <div class="file-image-container">
                                <img src="${file.content}" alt="${this.escapeHtml(fileName)}" class="uploaded-image">
                                <div class="image-info">
                                    <div class="file-name"><strong>${this.escapeHtml(fileName)}</strong></div>
                                    <div class="file-details">${fileType} ${fileSize}</div>
                                </div>
                            </div>
                        </div>
                    `;
                }
                // If file has URL or other image reference
                else if (file.url || file.src) {
                    const imageUrl = file.url || file.src;
                    return `
                        <div class="file-item image-file">
                            <div class="file-image-container">
                                <img src="${imageUrl}" alt="${this.escapeHtml(fileName)}" class="uploaded-image">
                                <div class="image-info">
                                    <div class="file-name"><strong>${this.escapeHtml(fileName)}</strong></div>
                                    <div class="file-details">${fileType} ${fileSize}</div>
                                </div>
                            </div>
                        </div>
                    `;
                }
            }
            
            // For non-images or images without content, show file icon
            return `
                <div class="file-item">
                    <div class="file-icon">${fileExt}</div>
                    <div>
                        <div class="file-name"><strong>${this.escapeHtml(fileName)}</strong></div>
                        <div class="file-details">${fileType} ${fileSize}</div>
                    </div>
                </div>
            `;
        }).join('');
        
        return this.wrapQuestion(element, `<div class="file-list">${filesHtml}</div>`);
    }

    isImageFile(file) {
        if (!file) return false;
        
        // Check by file type
        if (file.type && file.type.startsWith('image/')) {
            return true;
        }
        
        // Check by file extension
        if (file.name) {
            const ext = file.name.split('.').pop()?.toLowerCase();
            return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext || '');
        }
        
        // Check by content type
        if (file.content && typeof file.content === 'string' && file.content.startsWith('data:image')) {
            return true;
        }
        
        return false;
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    generateMatrixQuestion(element, surveyData) {
        const value = surveyData[element.name] || {};
        const rows = element.rows || [];
        const columns = element.columns || [];
        
        if (rows.length === 0 || columns.length === 0) {
            return this.wrapQuestion(element, '<div class="no-response">Matrix structure not defined</div>');
        }
        
        let tableHtml = `
            <table class="matrix-table">
                <thead>
                    <tr>
                        <th>Question</th>
                        ${columns.map(col => `<th>${this.escapeHtml(typeof col === 'object' ? col.text : col)}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
        `;
        
        rows.forEach(row => {
            const rowValue = typeof row === 'object' ? row.value : row;
            const rowText = typeof row === 'object' ? row.text : row;
            const selectedValue = value[rowValue];
            
            tableHtml += `<tr><td><strong>${this.escapeHtml(rowText)}</strong></td>`;
            
            columns.forEach(col => {
                const colValue = typeof col === 'object' ? col.value : col;
                const isSelected = selectedValue === colValue;
                
                tableHtml += `<td class="${isSelected ? 'matrix-cell-selected' : ''}">${isSelected ? '✓' : ''}</td>`;
            });
            
            tableHtml += '</tr>';
        });
        
        tableHtml += '</tbody></table>';
        
        return this.wrapQuestion(element, tableHtml);
    }

    generatePanel(element, surveyData, layout) {
        const panelTitle = element.title || element.name;
        const panelDescription = element.description || '';
        
        return `
            <div class="survey-panel">
                <div class="panel-header">
                    <div class="panel-title">${panelTitle}</div>
                    ${panelDescription ? `<div class="panel-description">${panelDescription}</div>` : ''}
                </div>
                <div class="panel-content">
                    ${this.generateElements(element.elements || [], surveyData, layout)}
                </div>
            </div>
        `;
    }

    generateDynamicPanel(element, surveyData, layout) {
        const panelData = surveyData[element.name] || [];
        const panelTitle = element.title || element.name;
        
        if (!Array.isArray(panelData) || panelData.length === 0) {
            return this.wrapQuestion(element, '<div class="no-response">No items added</div>');
        }
        
        const panelsHtml = panelData.map((itemData, index) => `
            <div class="dynamic-panel">
                <div class="dynamic-panel-header">Item ${index + 1}</div>
                <div class="dynamic-panel-content">
                    ${this.generateElements(element.templateElements || [], itemData, layout)}
                </div>
            </div>
        `).join('');
        
        return this.wrapQuestion(element, panelsHtml);
    }

    // Additional question type handlers would go here...
    generateDropdownQuestion(element, surveyData) {
        const value = surveyData[element.name];
        const choices = element.choices || [];
        
        if (!value) {
            return this.wrapQuestion(element, '<div class="no-response">No selection made</div>');
        }
        
        const selectedChoice = choices.find(choice => {
            const choiceValue = typeof choice === 'object' ? choice.value : choice;
            return choiceValue === value;
        });
        
        const displayText = selectedChoice 
            ? (typeof selectedChoice === 'object' ? selectedChoice.text : selectedChoice)
            : value;
        
        return this.wrapQuestion(element, `
            <div class="question-value">${this.escapeHtml(displayText)}</div>
        `);
    }

    generateRatingQuestion(element, surveyData) {
        const value = surveyData[element.name];
        const rateMin = element.rateMin || 1;
        const rateMax = element.rateMax || 5;
        const minText = element.minRateDescription || '';
        const maxText = element.maxRateDescription || '';
        
        const ratingItems = [];
        for (let i = rateMin; i <= rateMax; i++) {
            const isSelected = value !== null && value !== undefined && i === parseInt(value);
            ratingItems.push(`
                <div class="rating-item ${isSelected ? 'selected' : ''}">${i}</div>
            `);
        }
        
        return this.wrapQuestion(element, `
            <div class="question-rating">
                <div class="rating-scale">${ratingItems.join('')}</div>
                ${value === null || value === undefined ? '<div class="no-response" style="margin-left: 10px;">No rating provided</div>' : ''}
            </div>
            ${(minText || maxText) ? `
                <div class="rating-labels">
                    <span>${this.escapeHtml(minText)}</span>
                    <span>${this.escapeHtml(maxText)}</span>
                </div>
            ` : ''}
        `);
    }

    generateTagboxQuestion(element, surveyData) {
        const value = surveyData[element.name];
        const selectedValues = Array.isArray(value) ? value : (value ? [value] : []);
        const choices = element.choices || [];
        
        if (selectedValues.length === 0) {
            return this.wrapQuestion(element, '<div class="no-response">No selections made</div>');
        }
        
        const selectedTexts = selectedValues.map(val => {
            const choice = choices.find(c => (typeof c === 'object' ? c.value : c) === val);
            return choice ? (typeof choice === 'object' ? choice.text : choice) : val;
        });
        
        return this.wrapQuestion(element, `
            <div class="question-value">
                <div class="tag-container">
                    ${selectedTexts.map(text => `<span class="tag">${this.escapeHtml(text)}</span>`).join('')}
                </div>
            </div>
        `);
    }

    generateRankingQuestion(element, surveyData) {
        const value = surveyData[element.name];
        const choices = element.choices || [];
        
        if (!value || !Array.isArray(value)) {
            return this.wrapQuestion(element, '<div class="no-response">No ranking provided</div>');
        }
        
        const rankedItems = value.map((item, index) => {
            const choice = choices.find(c => (typeof c === 'object' ? c.value : c) === item);
            const text = choice ? (typeof choice === 'object' ? choice.text : choice) : item;
            return `
                <div class="rank-item">
                    <span class="rank-number">${index + 1}</span>
                    <span class="rank-text">${this.escapeHtml(text)}</span>
                </div>
            `;
        }).join('');
        
        return this.wrapQuestion(element, `
            <div class="ranking-container">
                ${rankedItems}
            </div>
        `);
    }

    generateImagePickerQuestion(element, surveyData) {
        const value = surveyData[element.name];
        const selectedValues = Array.isArray(value) ? value : (value ? [value] : []);
        const choices = element.choices || [];
        
        if (choices.length === 0) {
            return this.wrapQuestion(element, '<div class="no-response">No image choices defined</div>');
        }
        
        const imagesHtml = choices.map(choice => {
            const choiceValue = typeof choice === 'object' ? choice.value : choice;
            const choiceText = typeof choice === 'object' ? choice.text : choice;
            const choiceImage = typeof choice === 'object' ? choice.imageLink : '';
            const isSelected = selectedValues.includes(choiceValue);
            
            return `
                <div class="image-choice ${isSelected ? 'selected' : ''}">
                    ${choiceImage ? `<img src="${choiceImage}" alt="${this.escapeHtml(choiceText)}">` : ''}
                    <div>${this.escapeHtml(choiceText)}</div>
                </div>
            `;
        }).join('');
        
        return this.wrapQuestion(element, `
            <div class="image-choice-container">
                ${imagesHtml}
            </div>
        `);
    }

    generateMatrixDropdownQuestion(element, surveyData) {
        const value = surveyData[element.name] || {};
        const rows = element.rows || [];
        const columns = element.columns || [];
        
        if (rows.length === 0 || columns.length === 0) {
            return this.wrapQuestion(element, '<div class="no-response">Matrix structure not defined</div>');
        }
        
        let tableHtml = `
            <table class="matrix-table">
                <thead>
                    <tr>
                        <th>Question</th>
                        ${columns.map(col => `<th>${this.escapeHtml(typeof col === 'object' ? col.title || col.name : col)}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
        `;
        
        rows.forEach(row => {
            const rowValue = typeof row === 'object' ? row.value : row;
            const rowText = typeof row === 'object' ? row.text : row;
            const rowData = value[rowValue] || {};
            
            tableHtml += `<tr><td><strong>${this.escapeHtml(rowText)}</strong></td>`;
            
            columns.forEach(col => {
                const colName = typeof col === 'object' ? col.name : col;
                const cellValue = rowData[colName];
                const displayValue = cellValue ? this.escapeHtml(String(cellValue)) : '';
                
                tableHtml += `<td>${displayValue}</td>`;
            });
            
            tableHtml += '</tr>';
        });
        
        tableHtml += '</tbody></table>';
        
        return this.wrapQuestion(element, tableHtml);
    }

    generateMatrixDynamicQuestion(element, surveyData) {
        const value = surveyData[element.name] || [];
        const columns = element.columns || [];
        
        if (!Array.isArray(value) || value.length === 0) {
            return this.wrapQuestion(element, '<div class="no-response">No matrix data available</div>');
        }
        
        if (columns.length === 0) {
            return this.wrapQuestion(element, '<div class="no-response">Matrix columns not defined</div>');
        }
        
        let tableHtml = `
            <table class="matrix-table">
                <thead>
                    <tr>
                        <th>#</th>
                        ${columns.map(col => `<th>${this.escapeHtml(typeof col === 'object' ? col.title || col.name : col)}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
        `;
        
        value.forEach((rowData, index) => {
            tableHtml += `<tr><td><strong>${index + 1}</strong></td>`;
            
            columns.forEach(col => {
                const colName = typeof col === 'object' ? col.name : col;
                const cellValue = rowData[colName];
                const displayValue = cellValue ? this.escapeHtml(String(cellValue)) : '';
                
                tableHtml += `<td>${displayValue}</td>`;
            });
            
            tableHtml += '</tr>';
        });
        
        tableHtml += '</tbody></table>';
        
        return this.wrapQuestion(element, tableHtml);
    }

    generateImageQuestion(element, surveyData) {
        const imageUrl = element.imageLink || surveyData[element.name];
        if (!imageUrl) {
            return this.wrapQuestion(element, '<div class="no-response">No image available</div>');
        }
        
        return this.wrapQuestion(element, `
            <div class="question-image">
                <img src="${imageUrl}" alt="Question Image" style="max-width: 100%; height: auto; border: 1px solid #ddd; border-radius: 4px;">
            </div>
        `);
    }

    generateHtmlQuestion(element, surveyData) {
        const htmlContent = element.html || '';
        return this.wrapQuestion(element, `
            <div class="question-value html-content">
                ${htmlContent}
            </div>
        `);
    }

    generateExpressionQuestion(element, surveyData) {
        const value = surveyData[element.name];
        return this.wrapQuestion(element, `
            <div class="question-value calculated-value">
                ${value !== undefined ? this.escapeHtml(String(value)) : 'Not calculated'}
            </div>
        `);
    }

    generateFlowPanel(element, surveyData, layout) {
        // Flow panels are similar to regular panels but with different styling
        return this.generatePanel(element, surveyData, layout);
    }

    generateUnknownQuestion(element, surveyData) {
        const value = surveyData[element.name];
        return this.wrapQuestion(element, `
            <div class="question-value">
                <div><strong>Type:</strong> ${element.type}</div>
                <div><strong>Value:</strong> ${this.escapeHtml(JSON.stringify(value) || 'No response')}</div>
            </div>
        `);
    }

    // ============================
    // UTILITY METHODS
    // ============================

    wrapQuestion(element, content) {
        const questionTitle = element.title || element.name;
        const questionDescription = element.description || '';
        const isRequired = element.isRequired;
        
        return `
            <div class="survey-question question-${element.type}">
                <div class="question-title">
                    ${questionTitle}
                    ${isRequired ? '<span class="question-required"> *</span>' : ''}
                </div>
                ${questionDescription ? `<div class="question-description">${questionDescription}</div>` : ''}
                ${content}
            </div>
        `;
    }

    matchFieldPattern(key, value, patterns) {
        if (!value || value === '') return null;
        
        const lowerKey = key.toLowerCase();
        
        for (const pattern of patterns) {
            if (pattern.patterns.some(p => lowerKey.includes(p.toLowerCase()))) {
                return {
                    label: pattern.label,
                    value: this.formatValue(value),
                    source: 'pattern_match'
                };
            }
        }
        
        return null;
    }

    removeDuplicateFields(fields) {
        const seen = new Set();
        return fields.filter(field => {
            const key = `${field.label}:${field.value}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }

    formatLabel(key) {
        return key.replace(/([A-Z])/g, ' $1')
                 .replace(/[_-]/g, ' ')
                 .replace(/\b\w/g, l => l.toUpperCase())
                 .trim();
    }

    formatValue(value) {
        if (typeof value === 'string') return value;
        if (typeof value === 'number') return value.toString();
        if (typeof value === 'boolean') return value ? 'Yes' : 'No';
        if (Array.isArray(value)) return value.join(', ');
        if (typeof value === 'object') return JSON.stringify(value);
        return String(value);
    }

    traverseElements(surveyJson, callback) {
        const traverse = (elements) => {
            if (!elements) return;
            
            for (const element of elements) {
                callback(element);
                
                if (element.elements) {
                    traverse(element.elements);
                }
                if (element.templateElements) {
                    traverse(element.templateElements);
                }
            }
        };
        
        if (surveyJson.pages) {
            for (const page of surveyJson.pages) {
                traverse(page.elements);
            }
        } else if (surveyJson.elements) {
            traverse(surveyJson.elements);
        }
    }

    escapeHtml(text) {
        if (typeof text !== 'string') return text;
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    generateFooter(metadata) {
        return `
            <div class="pdf-footer" style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666; font-size: 12px;">
                Generated By Universal Checklist Generator, UCT © 2025
            </div>
        `;
    }
}

// ============================
// API IMPLEMENTATION
// ============================

const processor = new UniversalSurveyProcessor();

// Email configuration functions (reuse from your existing code)
function validateEmailConfig() {
    const emailUser = process.env.EMAIL_USER;
    const emailPassword = process.env.EMAIL_PASSWORD;
    
    if (!emailUser || !emailPassword || 
        emailUser === 'your-email@gmail.com' || 
        emailPassword === 'your-app-password') {
        return false;
    }
    
    return true;
}

const createEmailTransporter = () => {
    if (!validateEmailConfig()) {
        throw new Error('Email configuration not properly set.');
    }
    
    const emailConfig = {
        host: process.env.EMAIL_HOST || 'smtp-mail.outlook.com',
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: process.env.EMAIL_SECURE === 'true' ? true : false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        },
        tls: {
            rejectUnauthorized: false
        }
    };
    
    return nodemailer.createTransport(emailConfig);
};

// Enhanced PDF generation function
async function generatePDFBuffer(surveyJson, surveyData, metadata) {
    console.log('🚀 Starting Universal PDF Generation...');
    
    const htmlContent = processor.processSurvey(surveyJson, surveyData, metadata);
    
    console.log('📄 Generated HTML length:', htmlContent.length);
    
    const browser = await puppeteer.launch({
        headless: 'new',
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ]
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800 });
    await page.setContent(htmlContent, { 
        waitUntil: ['load', 'domcontentloaded', 'networkidle0'],
        timeout: 60000 
    });
    
    const pdfOptions = {
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true,
        margin: {
            top: '15mm',
            right: '10mm',
            bottom: '15mm',
            left: '10mm'
        }
    };
    
    console.log('📋 Generating PDF...');
    const pdfBuffer = await page.pdf(pdfOptions);
    
    await browser.close();
    console.log('✅ PDF generated successfully');
    
    return pdfBuffer;
}

// API Endpoints
app.post('/generate-pdf', async (req, res) => {
    try {
        console.log('=== Universal PDF Generation Request ===');
        
        const { surveyJson, surveyData, metadata, fileName } = req.body;
        
        if (!surveyJson && !surveyData) {
            return res.status(400).json({ error: 'Either surveyJson or surveyData is required' });
        }
        
        const pdfBuffer = await generatePDFBuffer(surveyJson, surveyData, metadata);
        
        const pdfFileName = fileName || `survey-${Date.now()}.pdf`;
        const pdfPath = path.join(uploadsDir, pdfFileName);
        fs.writeFileSync(pdfPath, pdfBuffer);
        
        console.log(`✅ Universal PDF generated: ${pdfPath}`);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${pdfFileName}"`);
        res.send(pdfBuffer);
        
    } catch (error) {
        console.error('❌ Universal PDF generation error:', error);
        res.status(500).json({ 
            error: 'PDF generation failed', 
            details: error.message 
        });
    }
});

app.post('/email-pdf', async (req, res) => {
    try {
        const { surveyJson, surveyData, metadata, fileName, recipientEmail, senderName, subject } = req.body;
        
        if (!recipientEmail) {
            return res.status(400).json({ error: 'Recipient email is required' });
        }
        
        if (!validateEmailConfig()) {
            return res.status(500).json({ 
                error: 'Email service not configured',
                configured: false 
            });
        }
        
        const pdfBuffer = await generatePDFBuffer(surveyJson, surveyData, metadata);
        
        const pdfFileName = fileName || `survey-${Date.now()}.pdf`;
        const pdfPath = path.join(tempDir, pdfFileName);
        fs.writeFileSync(pdfPath, pdfBuffer);
        
        const transporter = createEmailTransporter();
        await transporter.verify();
        
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: recipientEmail,
            subject: subject || 'Survey Report',
            html: `
                <h2>Survey Report</h2>
                <p>Please find attached the survey report generated by ${senderName || 'System'}.</p>
                <p><strong>Report:</strong> ${metadata?.title || 'Survey Results'}</p>
                <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
                <p>This is an automated email from the Universal Survey System.</p>
            `,
            attachments: [{
                filename: pdfFileName,
                path: pdfPath,
                contentType: 'application/pdf'
            }]
        };
        
        const emailResult = await transporter.sendMail(mailOptions);
        
        if (fs.existsSync(pdfPath)) {
            fs.unlinkSync(pdfPath);
        }
        
        res.json({ 
            success: true, 
            message: 'PDF emailed successfully',
            messageId: emailResult.messageId,
            recipient: recipientEmail,
            configured: true
        });
        
    } catch (error) {
        console.error('Email PDF error:', error);
        res.status(500).json({ 
            error: 'Email PDF failed', 
            details: error.message,
            configured: validateEmailConfig()
        });
    }
});

app.post('/save-to-shared-folder', async (req, res) => {
    try {
        const { surveyJson, surveyData, metadata, fileName } = req.body;
        
        const pdfBuffer = await generatePDFBuffer(surveyJson, surveyData, metadata);
        
        const sharedFolderPath = process.env.SHARED_FOLDER_PATH || 'M:\\Share\\MATERIALS\\Logistics\\Out Bound Shipments\\OUTGOING SHIPMENT PHOTO\\ONLINE_CHECK_LIST\\ROW';
        const pdfFileName = fileName || `survey-${Date.now()}.pdf`;
        const fullFilePath = path.join(sharedFolderPath, pdfFileName);
        
        if (!fs.existsSync(sharedFolderPath)) {
            fs.mkdirSync(sharedFolderPath, { recursive: true });
        }
        
        fs.writeFileSync(fullFilePath, pdfBuffer);
        
        const fileStats = fs.statSync(fullFilePath);
        
        res.json({ 
            success: true, 
            message: 'PDF saved to shared folder successfully',
            fileName: pdfFileName,
            filePath: fullFilePath,
            fileSize: fileStats.size,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Shared folder save error:', error);
        res.status(500).json({ 
            error: 'Shared folder save failed', 
            details: error.message
        });
    }
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        service: 'Universal SurveyJS PDF Generator', 
        version: '2.0.0',
        port: PORT,
        features: [
            'Automatic layout detection',
            'All SurveyJS question types',
            'Dynamic metadata extraction',
            'Multi-page surveys',
            'Email functionality',
            'Shared folder save',
            'Zero custom coding required'
        ],
        emailConfigured: validateEmailConfig(),
        questionTypesSupported: Array.from(processor.questionTypeHandlers.keys()),
        layoutTypes: ['table', 'form', 'card', 'list']
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Universal SurveyJS PDF Generator running on port ${PORT}`);
    console.log(`📊 Supported question types: ${Array.from(processor.questionTypeHandlers.keys()).length}`);
    console.log(`📧 Email configured: ${validateEmailConfig()}`);
    console.log(`✨ Zero custom coding required - handles any SurveyJS form automatically!`);
});

module.exports = app;