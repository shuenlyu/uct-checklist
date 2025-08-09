export const weld3202_json = {
  name: "weldment_header",
  defaultQuestionTitle: "Weldment Header",
  hideNumber: true,
  titleLocation: "hidden",
  elementsJSON: [
    {
      type: "panel",
      name: "panel3",
      elements: [
        {
          type: "text",
          name: "uctPartNum",
          title: "UCT Part Number",
        },
        {
          type: "text",
          name: "rev",
          startWithNewLine: false,
          title: "Rev",
        },
        {
          type: "text",
          name: "qty",
          startWithNewLine: false,
          title: "Qty",
        },
      ],
    },
    {
      type: "panel",
      name: "panel6",
      startWithNewLine: false,
      elements: [
        {
          type: "text",
          name: "date",
          startWithNewLine: false,
          title: "Date",
          maskType: "datetime",
          maskSettings: {
            pattern: "mm-dd-yyyy",
          },
        },
        {
          type: "boolean",
          name: "fairRequires",
          title: "If requires FAIR",
        },
      ],
    },
    {
      type: "panel",
      name: "panel5",
      startWithNewLine: false,
      elements: [
        {
          type: "text",
          name: "wo",
          title: "WO Number",
        },
          {
          type: "text",
          name: "operation",
          title: "Operation",
        },
        {
          type: "text",
          name: "plant_code",
          title: "Plant Code",
        },
        {
          type: "text",
          name: "station",
          title: "Station",
        },
        
        {
          type: "comment",
          name: "customer",
          title: "Customer",
        },
      ],
    },
  ],
};