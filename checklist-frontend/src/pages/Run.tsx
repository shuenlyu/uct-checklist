// require('dotenv').config();
import { useParams } from "react-router";
import {
  ITheme,
  matrixDropdownColumnTypes,
  Model,
  Serializer,
} from "survey-core";

import { useEffect, useState } from "react";
import "survey-core/defaultV2.css";
import { Survey } from "survey-react-ui";
import { useApi } from "../utils/api";
import { themes } from "../utils/themeOptions";

import Logger from "../utils/logger";

import { SurveyQuestionEditorDefinition } from "survey-creator-core";
// for showing signature pad on matrix drop down
matrixDropdownColumnTypes.signaturepad = {};
SurveyQuestionEditorDefinition.definition["matrixdropdowncolumn@signaturepad"] =
  {};
// for showing image type on matrix drop down
matrixDropdownColumnTypes.image = {};
SurveyQuestionEditorDefinition.definition["matrixdropdowncolumn@image"] = {};

// StylesManager.applyTheme("defaultV2");

function initializeModelFromURL(search: string, modelData: any) {
  const queryParams = new URLSearchParams(search);
  const model = new Model(modelData);
  const questionsToInitialize = [
    "predefinedfields",
    "checklist_header_fi",
    "checklist_header_shipkit",
  ];

  questionsToInitialize.forEach((questionName) => {
    const question = model.getQuestionByName(questionName);
    Logger.info("initializeModelFromURL: ", question);
    if (question) {
      queryParams.forEach((value, key) => {
        Logger.info("query parameters, key, value:", key, value);
        const subquestion = question.contentPanel.getQuestionByName(key);
        if (subquestion) {
          // Check if subquestion exists before assigning value
          subquestion.value = value;
        } else {
          Logger.warn(`Subquestion named ${key} not found in ${questionName}`);
        }
      });
    }
  });

  return model;
}

Logger.info("Process.env: ", process.env);
const Run = () => {
  // parse the query parameters from URL
  const { id } = useParams();
  const { fetchData, postData } = useApi();
  const [survey, setSurvey] = useState({ json: "", name: " " });
  const [theme, setTheme] = useState<ITheme>(themes[0]);

  //use initializeModelFromURL to initialize question values from queryParameters URL
  let model = initializeModelFromURL(window.location.search, survey.json);
  model.addNavigationItem({
    id: "survey_save_as_file",
    title: "Save as PDF",
    action: () => {
      window.print();
    },
  });

  Serializer.getProperty("survey", "clearInvisibleValues").defaultValue =
    "none";
  //model applyTheme
  const getTheme = async () => {
    const response = await fetchData("/getTheme?surveyId=" + id, false);
    setTheme(JSON.parse(response.data.theme));
  };

  model.applyTheme(theme);
  Logger.debug("Run: theme applied, ", theme);

  const getSurvey = async () => {
    const response = await fetchData("/getSurvey?surveyId=" + id, false);
    setSurvey(response.data);
  };

  useEffect(() => {
    getSurvey();
    getTheme();
  }, []);

  model.onComplete.add(async (sender: Model) => {
    Logger.debug("onComplete Survey data:", sender.data);
    await postData(
      "/post",
      {
        postId: id as string,
        surveyResult: sender.data,
        surveyResultText: JSON.stringify(sender.data),
      },
      false
    );
  });

  return (
    <>
      <Survey model={model} />
    </>
  );
};
export default Run;
