import { maxHeaderSize } from "http";
import { start } from "repl";
import { MatrixCellWrapperEditSurvey } from "survey-creator-core";

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
      maxWidth: "33%",
      minWidth: "33%",
      isRequired: true,
    },
    {
      type: "text",
      name: "oms",
      title: "OMS",
      titleLocation: "left",
      isRequired: true,
      minWidth: "33%",
      maxWidth: "33%",
      startWithNewLine: false,
    },
    {
      type: "text",
      name: "step",
      title: "Step",
      titleLocation: "left",
      isRequired: true,
      minWidth: "33%",
      maxWidth: "33%",
      startWithNewLine: false,
    },
    {
      type: "text",
      name: "station",
      title: "Station",
      titleLocation: "left",
      isRequired: true,
      minWidth: "33%",
      maxWidth: "33%",
    },
    {
      type: "text",
      name: "omssn",
      title: "OMS SN",
      titleLocation: "left",
      isRequired: true,
      minWidth: "23%",
      maxWidth: "23%",
      startWithNewLine: false,
    },
    {
      type: "text",
      name: "userid",
      title: "User ID",
      titleLocation: "left",
      isRequired: true,
      minWidth: "43%",
      maxWidth: "43%",
      startWithNewLine: false,
    },
  ],
};
