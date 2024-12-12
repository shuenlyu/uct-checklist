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

import { useLocation } from "react-router-dom";
import { SurveyQuestionEditorDefinition } from "survey-creator-core";
import Loading from "../components/Loading";

// 通过 TypeScript 的声明合并功能，扩展了 Window 接口，使得 Window 对象上可以存在一个名为 rerunSurvey 的方法
declare global {
  interface Window {
    rerunSurvey: () => void;
  }
}
// for showing signature pad on matrix drop down
matrixDropdownColumnTypes.signaturepad = {};
SurveyQuestionEditorDefinition.definition["matrixdropdowncolumn@signaturepad"] =
  {};
// for showing image type on matrix drop down
matrixDropdownColumnTypes.image = {};
SurveyQuestionEditorDefinition.definition["matrixdropdowncolumn@image"] = {};

// StylesManager.applyTheme("defaultV2");

interface ResultItem {
  createdAt: string;
  id: string;
  json: string;
  postid: string;
  submittedBy: string;
}

//TODO: populating fields from query parameters should be after fetch the latest result from the backend
function initializeModelFromURL(search: string, modelData: any) {
  const queryParams = new URLSearchParams(search);
  const model = new Model(modelData);
  const questionsToInitialize = [
    "datacollection_header",
    "checklist_header_fi",
    "checklist_header_shipkit",
    "checklist_content_fi",
    "universal_header",
    "universal_content",
  ];
  // HOW to handle this case to populate data from query parameters automatically
  const questions = model.getAllQuestions();

  //filtered out those questions that are in the questionsToInitialize or starts with the prefix
  const filteredQuestions = questions.filter((question) => {
    return questionsToInitialize.some((prefix) =>
      question.name.startsWith(prefix)
    );
  });

  filteredQuestions.forEach((question) => {
    Logger.info("initializeModelFromURL: question ", question);
    if (question) {
      queryParams.forEach((value, key) => {
        Logger.info("query parameters, key, value:", key, value);
        const subquestion = question.contentPanel.getQuestionByName(key);
        if (subquestion) {
          // Check if subquestion exists before assigning value
          subquestion.value = value;
        } else {
          Logger.warn(`Subquestion named ${key} not found in ${question.name}`);
        }
      });
    }
  });

  return model;
}

/**
 * Recursively merges the properties of two objects.
 *
 * @param target - The target object to merge into.
 * @param source - The source object to merge from.
 * @returns The merged object.
 */
function mergeDeep(target: any, source: any) {
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (target.hasOwnProperty(key)) {
        if (
          typeof target[key] === "object" &&
          typeof source[key] === "object"
        ) {
          mergeDeep(target[key], source[key]);
        }
      } else {
        target[key] = source[key];
      }
    }
  }
  return target;
}

Logger.info("Process.env: ", process.env);
const Run = () => {
  // parse the query parameters from URL
  const { id } = useParams();
  const location = useLocation();
  // in the results page, the result_id is passed as a state from the Viewer component
  const { result_id: initialResultId } = location.state || {};
  let result_id = initialResultId;
  Logger.info("Run state: result_id", result_id);

  //used for fetch results and filter the latest result based on the userID
  const queryParams = new URLSearchParams(window.location.search);
  const userId = queryParams.get("inspectedby")
    ? queryParams.get("inspectedby")
    : "noname";

  //get the id and view parameters from URL, 
  // UIB will pass id(last result id for a particular wo) as a parameter to view the last result
  result_id = queryParams.get("id") || result_id;
  // viewOnly is a flag to view the survey in read-only mode
  let viewOnly = false;
  if (queryParams.get("view") === "1") {
    viewOnly = true;
  }

  const { fetchData, postData } = useApi();
  const [survey, setSurvey] = useState({ json: "", name: " " });
  const [result, setResult] = useState({});
  const [theme, setTheme] = useState<ITheme>(themes[0]);

  //use initializeModelFromURL to initialize question values from queryParameters URL
  // QUESTION:survey.json is empty, how to populate the fields from query parameters
  let model = initializeModelFromURL(window.location.search, survey.json);

  //try to change the behavior of the completed page
  //rerun survey after complete the survey
  // model.showCompletedPage = false;
  model.completedHtml =
    "<h2>Thank you for your work!</h2><div style='display: flex; justify-content: center; text-align: center;'><button class='svc-preview__test-again sd-btn sd-btn--action sd-navigation__complete-btn' id='rerun' onclick='rerunSurvey()'>Run Survey Again</button></div>";
  const rerunSurvey = () => {
    // Logger.info("Rerun survey");
    model.clear(false);
  };
  window.rerunSurvey = rerunSurvey;

  Serializer.getProperty("survey", "clearInvisibleValues").defaultValue =
    "none";
  //model applyTheme
  const getTheme = async () => {
    const response = await fetchData("/getTheme?surveyId=" + id, false);
    if (response.data && response.data.theme) {
      setTheme(JSON.parse(response.data.theme));
    }
  };
  model.applyTheme(theme);
  Logger.debug("Run: theme applied, ", theme);

  const getSurvey = async () => {
    const response = await fetchData("/getSurvey?surveyId=" + id, false);
    setSurvey(response.data);
  };

  //TODO: implement get the latest result in the backend
  const getResults = async () => {
    const response = await fetchData("/results?postId=" + id, false);
    Logger.debug("Run getResults: ", response.data);

    if (response.data.length > 0) {
      // TODO: implement api to fetch result based result id
      if (result_id) {
        const filteredArray = response.data.filter(
          (item: ResultItem) => item.id === result_id
        );
        setResult(JSON.parse(filteredArray[0].json));
      } else {
        // Filter for the objects with the specific submittedBy value
        const filteredArray = response.data.filter(
          (item: ResultItem) => item.submittedBy === userId
        );
        // Find the object with the latest createdAt timestamp
        const latestEntry = filteredArray.reduce(
          (latest: ResultItem, current: ResultItem) => {
            return new Date(current.createdAt) > new Date(latest.createdAt)
              ? current
              : latest;
          }
        );
        setResult(JSON.parse(latestEntry.json));
      }
    }
  };

  //check if 'datacollection_header' exists in model.getAllQuestions()
  // disable load the last result for datacollection_header
  const shouldGetResults = !model
    .getAllQuestions()
    .some((question) => question.name === "datacollection_header") || result_id;

  //if result_id is not null, then get result from results table
  // if Run componenet got result data props, then disable getResults hook
  useEffect(() => {
    if (shouldGetResults) {
      getResults();
    }
  }, [result_id, shouldGetResults]);

  useEffect(() => {
    getSurvey();
    getTheme();
  }, []);
  //if result data is not empty, then getResults won't execute and assign model.data with result data
  if (Object.keys(result).length > 0 && shouldGetResults) {
    Logger.debug("Run: result data is not empty", result);
    //recursively merge result data and model data
    if (!result_id) {
      model.data = mergeDeep(model.data, result);
    } else {
      model.data = result;
    }
  }
  //Enable Save as PDF button
  model.addNavigationItem({
    id: "survey_save_as_file",
    title: "Save as PDF",
    action: () => {
      // using window built-in function to save the survey as PDF
      window.print();
    },
  });

  // if viewOnly is true, then set model.mode to display
  if (viewOnly) {
    model.mode = "display";
  }
  model.onComplete.add(async (sender: Model) => {
    Logger.debug("onComplete Survey data:", sender.data);
    await postData(
      "/post",
      {
        postId: id as string,
        surveyResult: sender.data,
        userId: userId,
        createdAt: new Date().toISOString(),
        // surveyResultText: JSON.stringify(sender.data),
      },
      false
    );
  });
  // if sruvey json is empty, show loading, otherwise show the survey
  return survey.json === "" ? (
    <Loading />
  ) : (
    <>
      <Survey model={model} />
    </>
  );
};
export default Run;
