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

// ADD THESE IMPORTS FOR BACK BUTTON
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaFilePdf, FaUser, FaCalendarAlt, FaEye, FaPlay } from 'react-icons/fa';

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

//[x]: populating fields from query parameters should be after fetch the latest result from the backend
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
  // add queryParams.get('userId') to get the userId from the URL if inspectedBY is not present, then use userid
  const queryParams = new URLSearchParams(window.location.search);
  const userId = queryParams.get("inspectedby")
    ? queryParams.get("inspectedby")
    : (queryParams.get("userid") ? queryParams.get("userid") : "noname");

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
    `<div class="bg-white rounded-lg p-8 text-center">
      <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
      </div>
      <h2 class="text-2xl font-bold text-gray-900 mb-2">Thank you for your work!</h2>
      <p class="text-gray-600 mb-6">Your checklist has been completed successfully.</p>
      <button class="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200" id="rerun" onclick="rerunSurvey()">
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
        </svg>
        Run Survey Again
      </button>
    </div>`;

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

  // UPDATED RETURN SECTION WITH BACK BUTTON
  if (survey.json === "") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loading />
          <p className="mt-4 text-gray-600">Loading checklist...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Back Button */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left side - Back button and title */}
            <div className="flex items-center space-x-4">
              <Link 
                to="/" 
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors duration-200 shadow-sm"
              >
                <FaArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Link>
              
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  viewOnly ? 'bg-gray-100' : 'bg-green-100'
                }`}>
                  {viewOnly ? (
                    <FaEye className="w-4 h-4 text-gray-600" />
                  ) : (
                    <FaPlay className="w-4 h-4 text-green-600" />
                  )}
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">
                    {viewOnly ? 'Viewing' : 'Running'} Checklist
                  </h1>
                  <p className="text-sm text-gray-500">{survey.name}</p>
                </div>
              </div>
            </div>

            {/* Right side - Additional actions */}
            <div className="flex items-center space-x-4">
              {userId !== "noname" && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <FaUser className="w-4 h-4" />
                  <span>{userId}</span>
                </div>
              )}
              
              <button
                onClick={() => window.print()}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200"
              >
                <FaFilePdf className="w-4 h-4 mr-2" />
                Save PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Survey Container */}
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Survey Info Bar */}
          <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-4">
                <span className="text-gray-600">Survey ID: {id}</span>
                {result_id && (
                  <span className="text-gray-600">Result ID: {result_id}</span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <FaCalendarAlt className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">
                  {new Date().toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Survey Content */}
          <div className="p-6">
            <Survey model={model} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Run;