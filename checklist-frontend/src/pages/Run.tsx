// require('dotenv').config();
import { useParams } from "react-router";
import {
  ITheme,
  matrixDropdownColumnTypes,
  Model,
  Serializer,
} from "survey-core";

import { useEffect, useRef, useState } from "react";
import "survey-core/defaultV2.css";
import { SurveyHelper, SurveyPDF } from "survey-pdf";
import { Survey } from "survey-react-ui";
import PrintOptionsModal, { PdfOptions } from "../components/PrintOptionsModal";
import { useApi } from "../utils/api";
import { saveHtml2Pdf } from "../utils/saveToPdf";
import { themes } from "../utils/themeOptions";

import Logger from "../utils/logger";

import { SurveyQuestionEditorDefinition } from "survey-creator-core";
//survey helper functions
SurveyHelper.GAP_BETWEEN_COLUMNS = 1;
SurveyHelper.MATRIX_COLUMN_WIDTH = 3;
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
  const modelRef = useRef<any>(null);
  const [survey, setSurvey] = useState({ json: "", name: " " });
  const [theme, setTheme] = useState<ITheme>(themes[0]);

  const [printOptions, setPrintOptions] = useState(false);
  const [fileName, setFileName] = useState("downloadChecklist");
  const [pdfOptions, setPdfOptions] = useState<PdfOptions>({
    fontSize: 14,
    fontName: "Helvetica",
    margins: {
      left: 5,
      right: 5,
      top: 10,
      bot: 10,
    },
    orientation: "l",
    format: "a2",
  });

  //use initializeModelFromURL to initialize question values from queryParameters URL
  let model = initializeModelFromURL(window.location.search, survey.json);
  model.addNavigationItem({
    id: "survey_save_as_file",
    title: "Save as PDF",
    action: () => {
      openPrintModal();
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

  function createSurveyPdfModel(surveyModel: any) {
    Logger.info(surveyModel);

    const surveyPDF = new SurveyPDF(survey.json, {
      ...pdfOptions,
      // applyImageFit: true,
    });
    //Add this line
    surveyPDF.mode = "display";
    if (surveyModel) {
      surveyPDF.data = surveyModel.data;
    }

    return surveyPDF;
  }

  function saveSurveyToPdf(filename: any, surveyModel: any) {
    createSurveyPdfModel(surveyModel).save(filename);
  }

  const savePdf = function () {
    saveSurveyToPdf(fileName + ".pdf", modelRef.current);
  };

  const openPrintModal = () => {
    modelRef.current = model;
    setPrintOptions(true);
  };

  const closePrintModal = () => {
    model = modelRef.current;
    setPrintOptions(false);
  };

  model.onComplete.add(async (sender: Model) => {
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
      {printOptions && (
        <PrintOptionsModal
          fileName={fileName}
          setFileName={setFileName}
          pdfOptions={pdfOptions}
          setPdfOptions={setPdfOptions}
          // savePdf={savePdf}
          savePdf={saveHtml2Pdf}
          closeModal={closePrintModal}
        />
      )}
    </>
  );
};
export default Run;
