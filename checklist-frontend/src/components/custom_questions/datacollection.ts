// dc stands for datacollection
export const dc_predefined_json = {
  name: "datacollection_header",
  title: "Data Collection Header",
  titleLocation: "hidden",
  hideNumber: true,
  elementsJSON: [
    {
      type: "text",
      name: "wo",
      title: "WO",
      titleLocation: "left",
      minWidth: 200,
      isRequired: true,
    },
    {
      type: "text",
      name: "oms",
      title: "OMS",
      titleLocation: "left",
      isRequired: true,
      minWidth: 200,
      startWithNewLine: false,
    },
    {
      type: "text",
      name: "step",
      title: "Step",
      titleLocation: "left",
      isRequired: true,
      minWidth: 200,
      startWithNewLine: false,
    },
    {
      type: "text",
      name: "station",
      title: "Station",
      titleLocation: "left",
      isRequired: true,
      minWidth: 200,
    },
    {
      type: "text",
      name: "userid",
      title: "User ID",
      titleLocation: "left",
      isRequired: true,
      minWidth: 200,
      startWithNewLine: false,
    },
  ],
};
