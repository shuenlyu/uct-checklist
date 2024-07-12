export const checklistHeaderShipKit_json = {
  name: "checklist_header_shipkit",
  title: "Checklist ShipKit Header",
  titleLocation: "hidden",
  hideNumber: true,
  elementsJSON: [
    {
      type: "text",
      name: "wo",
      title: "Work Order",
      titleLocation: "left",
      // startWithNewLine: false,
      isRequired: true,
    },
    {
      type: "text",
      name: "toolid",
      title: "Tool ID",
      titleLocation: "left",
      startWithNewLine: false,
      isRequired: true,
    },
    {
      type: "text",
      inputType: "datetime-local",
      name: "date",
      title: "Date",
      titleLocation: "left",
      startWithNewLine: false,
      isRequired: true,
    },
  ],
};
