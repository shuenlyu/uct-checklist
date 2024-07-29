export const checklistShipkit_json = {
  name: "checklist_shipkit",
  title: "Checklist Shipkit",
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
        name: "item-no",
        title: "Item#",
        cellType: "text",
        inputType: "number",
        startWithNewLine: false,
      },
      {
        name: "part-no",
        title: "Part#",
        cellType: "text",
        startWithNewLine: false,
      },
      {
        name: "qty",
        title: "Qty",
        cellType: "text",
        inputType: "number",
        startWithNewLine: false,
      },
      {
        name: "description",
        title: "Description",
        cellType: "comment",
        startWithNewLine: false,
      },
      {
        name: "configuration",
        title: "Configuration",
        cellType: "text",
        startWithNewLine: false,
      },
      {
        name: "crate-no",
        title: "Crate Number",
        cellType: "text",
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
        name: "checkedBy",
        title: "Checked By",
        cellType: "signaturepad",
      },
    ],
  },
};