// require('dotenv').config();
import { useParams } from "react-router";
import { ITheme, Model, StylesManager, matrixDropdownColumnTypes } from "survey-core";

import { Survey } from "survey-react-ui";
import { SurveyPDF, SurveyHelper } from "survey-pdf";
import "survey-core/defaultV2.css";
import { useEffect, useRef, useState } from "react";
import { useApi } from "../utils/api";
import { themes } from "../utils/themeOptions";
import PrintOptionsModal, { PrintOptionsModalProps, PdfOptions } from "../components/PrintOptionsModal";

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

StylesManager.applyTheme("defaultV2");

interface QuestionData {
  [key: string]: string | undefined;
}

Logger.info("Process.env: ", process.env);
const Run = () => {
  // parse the query parameters from URL 
  const queryParams = new URLSearchParams(window.location.search);
  const term = queryParams.get("wo");
  const oms_value = queryParams.get("oms");
  const step_value = queryParams.get("step");
  const station_value = queryParams.get("station");
  const userid_value = queryParams.get("userid");

  const { id } = useParams();
  const { fetchData, postData } = useApi();
  const modelRef = useRef<any>(null);
  const [survey, setSurvey] = useState({ json: "", name: " " });
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
    orientation: "p",
    format: "a4",
  });

  let model = new Model(survey.json);

  //model applyTheme
  const storedTheme: string | null = localStorage.getItem("theme");
  let theme: ITheme;
  if (storedTheme !== null && themes.hasOwnProperty(storedTheme)) {
    const themeIndex: number = parseInt(storedTheme, 10);
    theme = themes[themeIndex as keyof typeof themes];
  } else {
    theme = themes[0];
  }
  model.applyTheme(theme);

  Logger.debug("Run: theme applied, ", theme);

  const getSurvey = async () => {
    const response = await fetchData("/getSurvey?surveyId=" + id, false);
    setSurvey(response.data);
  };

  useEffect(() => {
    getSurvey();
  }, []);

  function createSurveyPdfModel(surveyModel: any) {
    Logger.info(surveyModel);

    const surveyPDF = new SurveyPDF(survey.json, { ...pdfOptions });
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

  const subscribedQuestion = model.getQuestionByName("wo");
  if (subscribedQuestion && term) subscribedQuestion.value = term;
  const omsQuestion = model.getQuestionByName("oms");
  if (omsQuestion && oms_value) omsQuestion.value = oms_value;
  const stepQuestion = model.getQuestionByName("step");
  if (omsQuestion && oms_value) stepQuestion.value = step_value;
  const stationQuestion = model.getQuestionByName("station");
  if (stationQuestion && station_value) stationQuestion.value = station_value;
  const useridQuestion = model.getQuestionByName("userid");
  if (useridQuestion && userid_value) useridQuestion.value = userid_value;

  model.onComplete.add(async (sender: Model) => {
    await postData("/post", {
      postId: id as string,
      surveyResult: sender.data,
      surveyResultText: JSON.stringify(sender.data),
    }, false);
  });
  return (
    <>
      <h1
        style={{
          backgroundColor: "#fff",
          padding: "12px 15px 18px 20px",
          margin: 0,
          marginBottom: 25,
        }}
      >
        {survey.name}
      </h1>
      <div
        style={{
          width: 640,
          margin: " 0 auto ",
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <div>
          <button
            id="save"
            style={{
              marginTop: 20,
              backgroundColor: "#19b394",
              margin: "0 auto ",
            }}
            onClick={() => openPrintModal()}
          >
            Export to PDF{" "}
          </button>
        </div>
      </div>

      <Survey model={model} />
      {printOptions && (
        <PrintOptionsModal
          fileName={fileName}
          setFileName={setFileName}
          pdfOptions={pdfOptions}
          setPdfOptions={setPdfOptions}
          savePdf={savePdf}
          closeModal={closePrintModal}
        />
      )}
    </>
  );
};
export default Run;
