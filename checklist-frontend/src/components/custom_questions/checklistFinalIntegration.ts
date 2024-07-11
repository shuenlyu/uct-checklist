export const checklistFinalIntegration_json = {
  name: "checklist_final_integration",
  title: "Checklist Finale Integration",
  titleLocation: "hidden",
  hideNumber: true,
  elementsJSON: {
    type: "matrixdynamic",
    rowCount: 1,
    addRowText: "Add Item",
    addRowLocation: "bottom",
    allowRowsDragAndDrop: true,
    columns: [
      {
        name: "no",
        title: "No",
        cellType: "text",
        inputType: "number",
        startWithNewLine: false,
      },
      {
        name: "photo",
        title: "Photo",
        cellType: "file",
        imageHeight: "150",
        imageWidth: "200",
      },
      {
        name: "inspection",
        title: "Inspection",
        cellType: "comment",
        startWithNewLine: false,
      },
      {
        name: "inspected-by",
        title: "Inspected By",
        cellType: "text",
        startWithNewLine: false,
      },
      {
        name: "remarks",
        title: "Remarks",
        cellType: "comment",
        startWithNewLine: false,
      },
      {
        name: "verified-by",
        title: "Verified By",
        cellType: "signaturepad",
      },
    ],
  },
};
