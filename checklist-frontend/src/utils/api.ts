// Complete src/utils/api.ts - Production-Ready Configuration with Comprehensive Mock Checklist
import { useCallback } from 'react';

// Comprehensive mock checklist for PDF testing
const comprehensiveMockChecklist = {
  json: {
    title: "Equipment Inspection Checklist - Universal PDF Test",
    description: "Comprehensive checklist to test all PDF generation features",
    logoPosition: "right",
    completedHtml: "<div class='completed-message'>Inspection completed successfully!</div>",
    pages: [
      {
        name: "headerInfo",
        title: "Inspection Header Information",
        description: "Basic information about this inspection",
        elements: [
          {
            type: "panel",
            name: "inspection_header",
            title: "Inspection Details",
            elements: [
              {
                type: "text",
                name: "workOrder",
                title: "Work Order Number",
                isRequired: true,
                placeholder: "Enter work order number"
              },
              {
                type: "text",
                name: "station",
                title: "Station/Location",
                isRequired: true,
                placeholder: "e.g., Station A-1"
              },
              {
                type: "text",
                name: "toolId",
                title: "Tool/Equipment ID",
                isRequired: true,
                placeholder: "Enter equipment identifier"
              },
              {
                type: "dropdown",
                name: "department",
                title: "Department",
                isRequired: true,
                choices: [
                  { value: "production", text: "Production" },
                  { value: "maintenance", text: "Maintenance" },
                  { value: "quality", text: "Quality Assurance" },
                  { value: "engineering", text: "Engineering" },
                  { value: "facilities", text: "Facilities" }
                ]
              },
              {
                type: "dropdown",
                name: "shift",
                title: "Shift",
                choices: [
                  { value: "day", text: "Day Shift (7:00 AM - 3:00 PM)" },
                  { value: "evening", text: "Evening Shift (3:00 PM - 11:00 PM)" },
                  { value: "night", text: "Night Shift (11:00 PM - 7:00 AM)" }
                ]
              },
              {
                type: "text",
                name: "inspectedBy",
                title: "Inspector Name",
                isRequired: true,
                placeholder: "Full name of inspector"
              },
              {
                type: "text",
                name: "operator",
                title: "Operator on Duty",
                placeholder: "Name of equipment operator"
              }
            ]
          }
        ]
      },
      {
        name: "visualInspection",
        title: "Visual Inspection",
        description: "Perform visual checks of equipment condition",
        elements: [
          {
            type: "panel",
            name: "visual_checks",
            title: "Visual Condition Assessment",
            elements: [
              {
                type: "radiogroup",
                name: "overall_condition",
                title: "Overall Equipment Condition",
                isRequired: true,
                choices: [
                  { value: "excellent", text: "Excellent - No visible issues" },
                  { value: "good", text: "Good - Minor cosmetic issues only" },
                  { value: "fair", text: "Fair - Some wear but functional" },
                  { value: "poor", text: "Poor - Significant wear or damage" },
                  { value: "critical", text: "Critical - Immediate attention required" }
                ]
              },
              {
                type: "checkbox",
                name: "visible_issues",
                title: "Check all visible issues (if any)",
                choices: [
                  { value: "scratches", text: "Surface scratches or marks" },
                  { value: "dents", text: "Dents or deformation" },
                  { value: "corrosion", text: "Rust or corrosion" },
                  { value: "leaks", text: "Fluid leaks" },
                  { value: "loose_parts", text: "Loose or missing parts" },
                  { value: "contamination", text: "Contamination or debris" },
                  { value: "wear", text: "Excessive wear" },
                  { value: "none", text: "No visible issues" }
                ]
              },
              {
                type: "comment",
                name: "visual_notes",
                title: "Additional Visual Inspection Notes",
                placeholder: "Describe any specific observations, concerns, or recommendations..."
              }
            ]
          }
        ]
      },
      {
        name: "functionalTests",
        title: "Functional Testing",
        description: "Test equipment functionality and performance",
        elements: [
          {
            type: "matrix",
            name: "component_tests",
            title: "Component Function Tests",
            isRequired: true,
            columns: [
              { value: "pass", text: "Pass" },
              { value: "fail", text: "Fail" },
              { value: "na", text: "N/A" }
            ],
            rows: [
              { value: "power_on", text: "Power On/Off Function" },
              { value: "safety_systems", text: "Safety Systems" },
              { value: "emergency_stop", text: "Emergency Stop" },
              { value: "controls", text: "Control Panel/Interface" },
              { value: "indicators", text: "Status Indicators/Lights" },
              { value: "alarms", text: "Alarm Systems" },
              { value: "sensors", text: "Sensors and Detectors" },
              { value: "moving_parts", text: "Moving Parts/Motors" }
            ]
          },
          {
            type: "rating",
            name: "performance_rating",
            title: "Overall Performance Rating",
            isRequired: true,
            rateMin: 1,
            rateMax: 10,
            minRateDescription: "Poor Performance",
            maxRateDescription: "Excellent Performance"
          },
          {
            type: "boolean",
            name: "calibration_current",
            title: "Is equipment calibration current?",
            isRequired: true
          },
          {
            type: "comment",
            name: "functional_notes",
            title: "Functional Test Notes",
            placeholder: "Document any functional issues, performance concerns, or test results..."
          }
        ]
      },
      {
        name: "safetyCompliance",
        title: "Safety & Compliance",
        description: "Safety checks and regulatory compliance verification",
        elements: [
          {
            type: "panel",
            name: "safety_panel",
            title: "Safety Verification",
            elements: [
              {
                type: "checkbox",
                name: "safety_items",
                title: "Safety Requirements Verified",
                isRequired: true,
                choices: [
                  { value: "ppe_available", text: "Required PPE available and in good condition" },
                  { value: "safety_signs", text: "Safety signs and labels visible and legible" },
                  { value: "guards_installed", text: "Safety guards and barriers properly installed" },
                  { value: "lockout_tagout", text: "Lockout/Tagout procedures posted and current" },
                  { value: "fire_equipment", text: "Fire safety equipment accessible" },
                  { value: "first_aid", text: "First aid equipment available" },
                  { value: "ventilation", text: "Adequate ventilation/air quality" },
                  { value: "lighting", text: "Adequate lighting in work area" }
                ]
              },
              {
                type: "radiogroup",
                name: "safety_compliance",
                title: "Overall Safety Compliance Level",
                isRequired: true,
                choices: [
                  { value: "full", text: "Fully Compliant - All requirements met" },
                  { value: "minor", text: "Minor Issues - Small deficiencies noted" },
                  { value: "major", text: "Major Issues - Significant safety concerns" },
                  { value: "critical", text: "Critical - Immediate safety hazard present" }
                ]
              }
            ]
          }
        ]
      },
      {
        name: "measurements",
        title: "Measurements & Readings",
        description: "Record critical measurements and parameter readings",
        elements: [
          {
            type: "paneldynamic",
            name: "measurement_readings",
            title: "Parameter Measurements",
            templateElements: [
              {
                type: "text",
                name: "parameter_name",
                title: "Parameter Name",
                isRequired: true,
                placeholder: "e.g., Temperature, Pressure, Voltage"
              },
              {
                type: "text",
                name: "measured_value",
                title: "Measured Value",
                isRequired: true,
                placeholder: "Enter measured value"
              },
              {
                type: "text",
                name: "unit",
                title: "Unit",
                placeholder: "e.g., °C, PSI, V"
              },
              {
                type: "text",
                name: "acceptable_range",
                title: "Acceptable Range",
                placeholder: "e.g., 20-25°C"
              },
              {
                type: "radiogroup",
                name: "status",
                title: "Status",
                choices: [
                  { value: "within_range", text: "Within Acceptable Range" },
                  { value: "out_of_range", text: "Out of Range" },
                  { value: "borderline", text: "Borderline/Monitor" }
                ]
              }
            ],
            panelCount: 3,
            minPanelCount: 1,
            maxPanelCount: 10,
            panelAddText: "Add Measurement",
            panelRemoveText: "Remove"
          }
        ]
      },
      {
        name: "photoDocumentation",
        title: "Photo Documentation",
        description: "Equipment photos and visual documentation",
        elements: [
          {
            type: "panel",
            name: "photo_panel",
            title: "Equipment Photography",
            elements: [
              {
                type: "image",
                name: "equipment_diagram",
                title: "Equipment Reference Diagram",
                imageLink: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iIzAwN2FjYyIvPgogIDx0ZXh0IHg9IjIwMCIgeT0iMTUwIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+RXF1aXBtZW50IERpYWdyYW08L3RleHQ+Cjwvc3ZnPg==",
                imageWidth: "400px",
                imageHeight: "300px"
              },
              {
                type: "imagepicker",
                name: "inspection_photos",
                title: "Select applicable equipment photos taken during inspection",
                multiSelect: true,
                choices: [
                  {
                    value: "front_view",
                    text: "Front View",
                    imageLink: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iIzI4YTc0NSIvPgogIDx0ZXh0IHg9IjEwMCIgeT0iNzUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Gcm9udCBWaWV3PC90ZXh0Pgo8L3N2Zz4="
                  },
                  {
                    value: "control_panel",
                    text: "Control Panel",
                    imageLink: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iIzAwN2FjYyIvPgogIDx0ZXh0IHg9IjEwMCIgeT0iNzUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Db250cm9sIFBhbmVsPC90ZXh0Pgo8L3N2Zz4="
                  },
                  {
                    value: "safety_equipment",
                    text: "Safety Equipment",
                    imageLink: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iI2ZmYzEwNyIvPgogIDx0ZXh0IHg9IjEwMCIgeT0iNjgiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMiIgZmlsbD0iYmxhY2siIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5TYWZldHk8L3RleHQ+CiAgPHRleHQgeD0iMTAwIiB5PSI4NSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjEyIiBmaWxsPSJibGFjayIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkVxdWlwbWVudDwvdGV4dD4KPC9zdmc+"
                  },
                  {
                    value: "damage_areas",
                    text: "Damage/Wear Areas",
                    imageLink: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iI2RjMzU0NSIvPgogIDx0ZXh0IHg9IjEwMCIgeT0iNjgiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMiIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5EYW1hZ2UvV2VhcjwvdGV4dD4KICA8dGV4dCB4PSIxMDAiIHk9Ijg1IiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+QXJlYXM8L3RleHQ+Cjwvc3ZnPg=="
                  },
                  {
                    value: "side_access",
                    text: "Side Access Panel",
                    imageLink: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iIzZmNDJjMSIvPgogIDx0ZXh0IHg9IjEwMCIgeT0iNjgiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMiIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5TaWRlIEFjY2VzczwvdGV4dD4KICA8dGV4dCB4PSIxMDAiIHk9Ijg1IiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+UGFuZWw8L3RleHQ+Cjwvc3ZnPg=="
                  },
                  {
                    value: "maintenance_area",
                    text: "Maintenance Access",
                    imageLink: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iIzIwYzk5NyIvPgogIDx0ZXh0IHg9IjEwMCIgeT0iNjgiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMiIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5NYWludGVuYW5jZTwvdGV4dD4KICA8dGV4dCB4PSIxMDAiIHk9Ijg1IiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+QWNjZXNzPC90ZXh0Pgo8L3N2Zz4="
                  }
                ]
              },
              {
                type: "comment",
                name: "photo_notes",
                title: "Photo Documentation Notes",
                placeholder: "Describe what is shown in the selected photos, any specific conditions observed, or additional context..."
              }
            ]
          }
        ]
      },
      {
        name: "documentation",
        title: "Documentation & Sign-off",
        description: "Complete inspection documentation and sign-off",
        elements: [
          {
            type: "panel",
            name: "completion_panel",
            title: "Inspection Completion",
            elements: [
              {
                type: "radiogroup",
                name: "inspection_result",
                title: "Overall Inspection Result",
                isRequired: true,
                choices: [
                  { value: "passed", text: "PASSED - Equipment ready for operation" },
                  { value: "passed_with_notes", text: "PASSED WITH NOTES - Minor issues documented" },
                  { value: "conditional", text: "CONDITIONAL - Requires monitoring/follow-up" },
                  { value: "failed", text: "FAILED - Equipment not suitable for operation" }
                ]
              },
              {
                type: "checkbox",
                name: "required_actions",
                title: "Required Actions (if any)",
                choices: [
                  { value: "maintenance", text: "Schedule maintenance" },
                  { value: "repair", text: "Immediate repair required" },
                  { value: "calibration", text: "Calibration needed" },
                  { value: "replacement", text: "Part replacement required" },
                  { value: "training", text: "Operator training recommended" },
                  { value: "monitoring", text: "Increased monitoring frequency" },
                  { value: "documentation", text: "Update documentation/procedures" },
                  { value: "none", text: "No action required" }
                ]
              },
              {
                type: "text",
                name: "next_inspection_date",
                title: "Next Scheduled Inspection Date",
                inputType: "date"
              },
              {
                type: "comment",
                name: "final_comments",
                title: "Final Comments and Recommendations",
                placeholder: "Summary of inspection findings, recommendations for improvement, or any other relevant information..."
              },
              {
                type: "signaturepad",
                name: "inspector_signature",
                title: "Inspector Digital Signature",
                isRequired: true,
                signatureWidth: 300,
                signatureHeight: 150,
                description: "Please draw your signature in the box below"
              },
              {
                type: "text",
                name: "inspector_name_typed",
                title: "Inspector Name (Typed)",
                isRequired: true,
                placeholder: "Type your full name"
              },
              {
                type: "text",
                name: "inspection_date_signed",
                title: "Date Signed",
                inputType: "date",
                defaultValueExpression: "today()"
              },
              {
                type: "signaturepad",
                name: "supervisor_signature",
                title: "Supervisor Digital Signature (if required)",
                signatureWidth: 300,
                signatureHeight: 150,
                description: "Supervisor signature for approval (optional)"
              },
              {
                type: "text",
                name: "supervisor_name_typed",
                title: "Supervisor Name (if applicable)",
                placeholder: "Supervisor full name"
              }
            ]
          }
        ]
      }
    ]
  },
  name: "Equipment Inspection Checklist - PDF Test"
};

// Mock response data that matches the checklist structure
const mockInspectionData = {
  workOrder: "WO-2025-001234",
  station: "Production Line A - Station 3",
  toolId: "EQUIP-A3-2024-001",
  department: "production",
  shift: "day",
  inspectedBy: "John Smith",
  operator: "Maria Garcia",
  overall_condition: "good",
  visible_issues: ["scratches"],
  visual_notes: "Minor surface scratches on the outer casing, but no impact on functionality. Equipment appears well-maintained overall.",
  component_tests: {
    power_on: "pass",
    safety_systems: "pass",
    emergency_stop: "pass",
    controls: "pass",
    indicators: "pass",
    alarms: "pass",
    sensors: "pass",
    moving_parts: "pass"
  },
  performance_rating: 8,
  calibration_current: true,
  functional_notes: "All systems functioning within normal parameters. Emergency stop test completed successfully.",
  safety_items: ["ppe_available", "safety_signs", "guards_installed", "lockout_tagout", "fire_equipment", "first_aid", "ventilation", "lighting"],
  safety_compliance: "full",
  measurement_readings: [
    {
      parameter_name: "Operating Temperature",
      measured_value: "23.5",
      unit: "°C",
      acceptable_range: "20-25°C",
      status: "within_range"
    },
    {
      parameter_name: "System Pressure",
      measured_value: "45.2",
      unit: "PSI",
      acceptable_range: "40-50 PSI",
      status: "within_range"
    },
    {
      parameter_name: "Input Voltage",
      measured_value: "240.1",
      unit: "V",
      acceptable_range: "230-250V",
      status: "within_range"
    }
  ],
  inspection_photos: ["front_view", "control_panel", "safety_equipment"],
  photo_notes: "Front view shows equipment in good condition with no visible damage. Control panel displays are clear and all indicators functioning properly. Safety equipment including emergency stops and warning labels are clearly visible and in good condition. No maintenance issues observed in photographed areas.",
  inspection_result: "passed",
  required_actions: ["none"],
  next_inspection_date: "2025-09-15",
  final_comments: "Equipment is in excellent working condition. All safety systems are operational. Recommend continuing current maintenance schedule. Minor cosmetic scratches noted but do not affect performance.",
  inspector_signature: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjE1MCIgZmlsbD0id2hpdGUiIHN0cm9rZT0iI2RkZCIgc3Ryb2tlLXdpZHRoPSIxIi8+CiAgPCEtLSBTaWduYXR1cmUgc3Ryb2tlIHBhdGhzIHRoYXQgbG9vayBsaWtlIGhhbmR3cml0aW5nIC0tPgogIDxwYXRoIGQ9Ik0zMCA4MCBRNTM2MCw4MCA5MCBRIDA3MCwxNDAgODUgUTE3MCA5NSwyMDAgNzUgUTIzMCA4NSwyNzAgOTUiIAogICAgICAgIHN0cm9rZT0iIzAwNjZjYyIgc3Ryb2tlLXdpZHRoPSIzIiBmaWxsPSJub25lIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KICA8cGF0aCBkPSJNNDAgMTEwIFE3MCA0MD51LDEwMCAxMTAgUTEzMCAxMTUsNjM5NNUgUTEOWCAxMDAsMjIwIDEK1MCIgCiAgICAgICAgc3Ryb2tlPSIjMDA2NmNjIiBzdHJva2Utd2lkdGg9IjIiIGZpbGw9Im5vbmUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgogIDxwYXRoIGQ9Ik02MCA5NSBROTA5MCwxMjAgOTUgUTE1MCAxMDAsWR4AuC9JACIgCiAgICAgICAgc3Ryb2tlPSIjMDA2NmNjIiBzdHJva2Utd2lkdGg9IjIiIGZpbGw9Im5vbmUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8L3N2Zz4=",
  inspector_name_typed: "John Smith",
  inspection_date_signed: "2025-08-09",
  supervisor_signature: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjE1MCIgZmlsbD0id2hpdGUiIHN0cm9rZT0iI2RkZCIgc3Ryb2tlLXdpZHRoPSIxIi8+CiAgPCEtLSBEaWZmZXJlbnQgc2lnbmF0dXJlIHN0eWxlIGZvciBzdXBlcnZpc29yIC0tPgogIDxwYXRoIGQ9Ik00MCA3MCBRNTM1LDEwMCA3NSBRM1MO8WMGMCAccess3-7LNjAgODBogI1MCA5MCwyNzAgNzUiIAogICAgICAgIHN0cm9rZT0iI2NjMDA2NiIgc3Ryb2tlLXdpZHRoPSIzIiBmaWxsPSJub25lIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KICA8cGF0aCBkPSJNNDAgMTA1IFE4MCA5NSwxMTAgcjUgUTE0byBkJOLJDeaccess4FE5WCmDPRsONMWFRCE2YWM5NSyJ_jAgMTAwIiBCiAgIChNLU4nc3Ryb2tlPSIjY2NtKLCA_VJY5IgNTAlZDNZUPSNJ=LcAG2jdWM9LZ2LcmWOgxVXWX9PSbmOUOZogJ4D9VRaFe54rQgNy0f83H3m6r8m,RD92MGV5L19hc1TUlfX2WcIj4N8c3l5I3J7NSJd92uR-OLgkPSJ_bM1biA8L3NZTFQ7oaRZJqjgU=",
  supervisor_name_typed: "Sarah Johnson"
};

// Enhanced mock data for development/fallback
const mockFolders = [
  {
    id: 1,
    name: "OTHERS",
    files: [
      { 
        id: "1", 
        name: "Sample Checklist 1", 
        customer: "Customer A", 
        prod_line: "Product X", 
        folder_id: 1, 
        groups: "ALL_SITES",
        json: { title: "Sample Survey" } 
      },
      { 
        id: "2", 
        name: "Sample Checklist 2", 
        customer: "Customer B", 
        prod_line: "Product Y", 
        folder_id: 1, 
        groups: "ALL_SITES",
        json: { title: "Sample Survey 2" } 
      }
    ]
  },
  {
    id: 2,
    name: "EQUIPMENT_INSPECTION",
    files: [
      { 
        id: "comprehensive_test", 
        name: "Equipment Inspection Checklist - PDF Test", 
        customer: "Universal Customer", 
        prod_line: "All Production Lines", 
        folder_id: 2, 
        groups: "ALL_SITES",
        json: comprehensiveMockChecklist.json
      }
    ]
  },
  {
    id: 3,
    name: "AMAT",
    files: [
      { 
        id: "3", 
        name: "AMAT Checklist", 
        customer: "AMAT Customer", 
        prod_line: "AMAT Product", 
        folder_id: 3, 
        groups: "ALL_SITES",
        json: { title: "AMAT Survey" } 
      }
    ]
  },
  {
    id: 4,
    name: "LAM",
    files: []
  },
  {
    id: 5,
    name: "Data_Collection",
    files: []
  },
  {
    id: 6,
    name: "TEST",
    files: [
      { 
        id: "4", 
        name: "Test Checklist", 
        customer: "Test Customer", 
        prod_line: "Test Product", 
        folder_id: 6, 
        groups: "ALL_SITES",
        json: { title: "Test Survey" } 
      }
    ]
  },
  {
    id: 7,
    name: "Parthib",
    files: []
  }
];

const mockSurvey = {
  json: {
    title: "Sample Survey",
    pages: [{
      name: "page1",
      elements: [{
        type: "text",
        name: "question1",
        title: "What is your name?"
      }, {
        type: "rating",
        name: "satisfaction",
        title: "How satisfied are you?",
        rateMax: 5
      }]
    }]
  },
  name: "Sample Survey"
};

const mockEmailList = [
  { Email: 'john.doe@company.com' },
  { Email: 'jane.smith@company.com' },
  { Email: 'dev.user@company.com' },
  { Email: 'test.user@company.com' }
];

function getMockData(endpoint: string): any {
  console.log(`📦 Returning mock data for: ${endpoint}`);
  
  // Handle different endpoint patterns
  if (endpoint === '/getFolders') {
    return { status: 200, data: mockFolders };
  }
  
  if (endpoint.includes('/folders/') && endpoint.includes('/files')) {
    const folderId = parseInt(endpoint.split('/')[2]);
    const folder = mockFolders.find(f => f.id === folderId);
    return { status: 200, data: folder?.files || [] };
  }
  
  if (endpoint.includes('/getSurvey')) {
    const surveyId = endpoint.split('surveyId=')[1];
    
    // Return comprehensive checklist for testing PDF generator
    if (surveyId === 'comprehensive_test') {
      console.log('🎯 Returning comprehensive test checklist for PDF testing');
      return { status: 200, data: comprehensiveMockChecklist };
    }
    
    // Return default mock survey for other IDs
    return { status: 200, data: mockSurvey };
  }
  
  if (endpoint.includes('/getTheme')) {
    return { status: 200, data: { theme: null } };
  }
  
  if (endpoint.includes('/results')) {
    const postId = endpoint.split('postId=')[1];
    
    // Return mock inspection data for comprehensive test with pre-filled answers
    if (postId === 'comprehensive_test') {
      console.log('🎯 Returning mock inspection data for PDF testing');
      return { 
        status: 200, 
        data: [
          {
            id: "result_001",
            postid: "comprehensive_test",
            submittedBy: "john.smith",
            createdAt: new Date().toISOString(),
            json: JSON.stringify(mockInspectionData)
          }
        ]
      };
    }
    
    return { status: 200, data: [] };
  }
  
  if (endpoint === '/getEmailList') {
    return { status: 200, data: mockEmailList };
  }
  
  if (endpoint.includes('/changeName')) {
    const updatedSurvey = {
      id: "updated-" + Date.now(),
      name: "Updated Survey",
      customer: "Updated Customer",
      prod_line: "Updated Product",
      folder_id: 1,
      groups: "ALL_SITES",
      json: mockSurvey.json
    };
    return { status: 200, data: updatedSurvey };
  }
  
  if (endpoint.includes('/delete')) {
    return { status: 200, data: { message: 'Deleted successfully' } };
  }
  
  // Default response
  return { status: 200, data: {} };
}

export const useApi = () => {
  const fetchData = useCallback(async (endpoint: string, requiresAuth: boolean = true) => {
    console.log(`🔄 API Call: ${endpoint}`);
    
    // Check if we should use mock data (only in development with explicit flag)
    const useMockData = process.env.NODE_ENV === 'development' && 
                       process.env.REACT_APP_USE_MOCK_DATA === 'true';
    
    if (useMockData) {
      console.log('🚀 Using mock data (development mode)');
      await new Promise(resolve => setTimeout(resolve, 200)); // Simulate network delay
      return getMockData(endpoint);
    }

    // Production mode - Make real API calls
    const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3002';
    
    if (!baseUrl) {
      console.error('❌ REACT_APP_API_BASE_URL is not defined');
      throw new Error('API base URL is not configured');
    }
    
    try {
      console.log(`🌐 Making real API call to: ${baseUrl}${endpoint}`);
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'GET',
        credentials: requiresAuth ? 'include' : 'same-origin',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ API call successful');
      return { status: response.status, data };
      
    } catch (error) {
      console.error(`❌ API Error for ${endpoint}:`, error);
      
      // Only fallback to mock data in development
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 API failed in development, falling back to mock data');
        return getMockData(endpoint);
      }
      
      // In production, throw the error
      throw error;
    }
  }, []);

  const postData = useCallback(async (endpoint: string, body: any, requiresAuth: boolean = true) => {
    console.log(`📤 POST API Call: ${endpoint}`, body);
    
    // Check if we should use mock data (only in development with explicit flag)
    const useMockData = process.env.NODE_ENV === 'development' && 
                       process.env.REACT_APP_USE_MOCK_DATA === 'true';
    
    if (useMockData) {
      console.log('🚀 Mock POST operation');
      await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay
      
      if (endpoint === '/folders') {
        const newFolder = { 
          id: Date.now(), 
          name: body.name, 
          files: [] 
        };
        return { status: 200, data: [newFolder] };
      }
      
      if (endpoint === '/create' || endpoint === '/duplicate') {
        const newSurvey = {
          id: Date.now().toString(),
          name: body.name,
          customer: body.customer,
          prod_line: body.product || body.prod_line,
          folder_id: body.folderId,
          groups: "ALL_SITES",
          json: body.json || mockSurvey.json
        };
        return { status: 200, data: newSurvey };
      }
      
      if (endpoint === '/post') {
        return { status: 200, data: { message: 'Survey response saved' } };
      }
      
      if (endpoint === '/changeJson') {
        return { status: 200, data: { message: 'Survey JSON updated' } };
      }
      
      if (endpoint === '/changeTheme') {
        return { status: 200, data: { message: 'Theme updated' } };
      }
      
      return { status: 200, data: { message: 'Mock POST success' } };
    }

    // Production mode - Make real API calls
    const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3002';
    
    if (!baseUrl) {
      console.error('❌ REACT_APP_API_BASE_URL is not defined');
      throw new Error('API base URL is not configured');
    }
    
    try {
      console.log(`🌐 Making real POST API call to: ${baseUrl}${endpoint}`);
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'POST',
        credentials: requiresAuth ? 'include' : 'same-origin',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ POST API call successful');
      return { status: response.status, data };
      
    } catch (error) {
      console.error(`❌ POST API Error for ${endpoint}:`, error);
      
      // Only fallback to mock data in development
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 POST API failed in development, returning mock success');
        return { status: 200, data: { message: 'Mock success (API failed)' } };
      }
      
      // In production, throw the error
      throw error;
    }
  }, []);

  const deleteData = useCallback(async (endpoint: string, requiresAuth: boolean = true) => {
    console.log(`🗑️ DELETE API Call: ${endpoint}`);
    
    // Check if we should use mock data (only in development with explicit flag)
    const useMockData = process.env.NODE_ENV === 'development' && 
                       process.env.REACT_APP_USE_MOCK_DATA === 'true';
    
    if (useMockData) {
      console.log('🚀 Mock DELETE operation');
      await new Promise(resolve => setTimeout(resolve, 200));
      return { status: 200, data: { message: 'Mock delete success' } };
    }

    // Production mode - Make real API calls
    const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3002';
    
    if (!baseUrl) {
      console.error('❌ REACT_APP_API_BASE_URL is not defined');
      throw new Error('API base URL is not configured');
    }
    
    try {
      console.log(`🌐 Making real DELETE API call to: ${baseUrl}${endpoint}`);
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'DELETE',
        credentials: requiresAuth ? 'include' : 'same-origin'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ DELETE API call successful');
      return { status: response.status, data };
      
    } catch (error) {
      console.error(`❌ DELETE API Error for ${endpoint}:`, error);
      
      // Only fallback to mock data in development
      if (process.env.NODE_ENV === 'development') {
        return { status: 200, data: { message: 'Mock delete success (API failed)' } };
      }
      
      // In production, throw the error
      throw error;
    }
  }, []);

  const putData = useCallback(async (endpoint: string, body: any, requiresAuth: boolean = true) => {
    console.log(`📝 PUT API Call: ${endpoint}`, body);
    
    // Check if we should use mock data (only in development with explicit flag)
    const useMockData = process.env.NODE_ENV === 'development' && 
                       process.env.REACT_APP_USE_MOCK_DATA === 'true';
    
    if (useMockData) {
      console.log('🚀 Mock PUT operation');
      await new Promise(resolve => setTimeout(resolve, 200));
      return { status: 200, data: { message: 'Mock PUT success' } };
    }

    // Production mode - Make real API calls
    const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3002';
    
    if (!baseUrl) {
      console.error('❌ REACT_APP_API_BASE_URL is not defined');
      throw new Error('API base URL is not configured');
    }
    
    try {
      console.log(`🌐 Making real PUT API call to: ${baseUrl}${endpoint}`);
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'PUT',
        credentials: requiresAuth ? 'include' : 'same-origin',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ PUT API call successful');
      return { status: response.status, data };
      
    } catch (error) {
      console.error(`❌ PUT API Error for ${endpoint}:`, error);
      
      // Only fallback to mock data in development
      if (process.env.NODE_ENV === 'development') {
        return { status: 200, data: { message: 'Mock PUT success (API failed)' } };
      }
      
      // In production, throw the error
      throw error;
    }
  }, []);

  return { fetchData, postData, deleteData, putData };
};