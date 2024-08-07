export const checklistHeader_json = {
  name: "checklist_header",
  title: "Checklist Header",
  titleLocation: "hidden",
  hideNumber: true,
  elementsJSON: [
    {
      type: "text",
      name: "station",
      title: "Station",
      titleLocation: "left",
      isRequired: true,
    },
    {
      type: "text",
      name: "wo",
      title: "Work Order",
      titleLocation: "left",
      startWithNewLine: false,
      isRequired: true,
    },
    {
      type: "text",
      name: "toolid",
      title: "Tool ID",
      titleLocation: "left",
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
