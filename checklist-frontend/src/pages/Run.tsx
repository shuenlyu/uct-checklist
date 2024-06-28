// require('dotenv').config();
import { useParams } from "react-router";
import {
  ITheme,
  Model,
  StylesManager,
  matrixDropdownColumnTypes,
} from "survey-core";

import { Survey } from "survey-react-ui";
import { SurveyPDF, SurveyHelper } from "survey-pdf";
import "survey-core/defaultV2.css";
import { useEffect, useRef, useState } from "react";
import { useApi } from "../utils/api";
import {
  ContrastDark,
  DefaultLight,
  ContrastLight,
  DefaultDark,
  BorderlessDarkPanelless,
  BorderlessDark,
  BorderlessLightPanelless,
  BorderlessLight,
  ContrastDarkPanelless,
  ContrastLightPanelless,
  DefaultLightPanelless,
  DoubleBorderDarkPanelless,
  DoubleBorderDark,
  DoubleBorderLightPanelless,
  DoubleBorderLight,
  FlatDarkPanelless,
  FlatDark,
  FlatLightPanelless,
  FlatLight,
  LayeredDarkPanelless,
  LayeredDark,
  LayeredLightPanelless,
  LayeredLight,
  PlainDarkPanelless,
  PlainDark,
  PlainLightPanelless,
  PlainLight,
  SharpDarkPanelless,
  SharpDark,
  SharpLightPanelless,
  SharpLight,
  SolidDarkPanelless,
  SolidDark,
  SolidLightPanelless,
  SolidLight,
  ThreeDimensionalDarkPanelless,
  ThreeDimensionalDark,
  ThreeDimensionalLightPanelless,
  ThreeDimensionalLight

} from "survey-core/themes";
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

interface PdfOptions {
  fontSize: number;
  fontName: string;
  margins: {
    left: number;
    right: number;
    top: number;
    bot: number;
  };
  orientation: "p" | "l" | undefined;
  format: string;
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
  let themes = {
    0: DefaultLight,
    1: DefaultDark,
    2: ContrastLight,
    3: ContrastDark,
    4: BorderlessDarkPanelless,
    5: BorderlessDark,
    6: BorderlessLightPanelless,
    7: BorderlessLight,
    8: ContrastDarkPanelless,
    9: ContrastLightPanelless,
    10: DefaultLightPanelless,
    11: DoubleBorderDarkPanelless,
    12: DoubleBorderDark,
    13: DoubleBorderLightPanelless,
    14: DoubleBorderLight,
    15: FlatDarkPanelless,
    16: FlatDark,
    17: FlatLightPanelless,
    18: FlatLight,
    19: LayeredDarkPanelless,
    20: LayeredDark,
    21: LayeredLightPanelless,
    22: LayeredLight,
    23: PlainDarkPanelless,
    24: PlainDark,
    25: PlainLightPanelless,
    26: PlainLight,
    27: SharpDarkPanelless,
    28: SharpDark,
    29: SharpLightPanelless,
    30: SharpLight,
    31: SolidDarkPanelless,
    32: SolidDark,
    33: SolidLightPanelless,
    34: SolidLight,
    35: ThreeDimensionalDarkPanelless,
    36: ThreeDimensionalDark,
    37: ThreeDimensionalLightPanelless,
    38: ThreeDimensionalLight
  };

  const storedTheme: string | null = localStorage.getItem("theme");
  let theme: ITheme;

  if (storedTheme !== null && themes.hasOwnProperty(storedTheme)) {
    const themeIndex: number = parseInt(storedTheme, 10);
    theme = themes[themeIndex as keyof typeof themes];
  } else {
    theme = themes[0];
  }

  model.applyTheme(theme);


  const getSurveyResults = async () => {
    const resultsAction = await fetchData("/results?postId=" + id);
    Logger.debug('getSurveyResults: id from useParams, ', id);

    let parsedQuestion = null;
    for (const result of resultsAction.data) {
      Logger.debug("getSurveyResults: Results are attampting to parse, ", result);
      let parsed;
      if (typeof result === 'string') {
        try {
          parsed = JSON.parse(result);
        } catch (e) {
          console.error("Error parsing JSON:", e);
        }
      } else {
        // If it's already an object, no need to parse
        parsed = result;
      }
      if (parsed.wo === term) {
        parsedQuestion = parsed;
        break;
      }
    }
    Logger.debug("parsedQuestions from getSurveyResults: ", parsedQuestion);
    return parsedQuestion;
  };

  const getSurvey = async () => {
    const response = await fetchData("/getSurvey?surveyId=" + id, false);
    setSurvey(response.data);
  };

  const fetchValues = async () => {
    if (term && survey.json.length > 0) {
      let isGotFilled = false;
      let data: QuestionData = {};
      let getResults = new Promise(function (myResolve, myReject) {
        const results = getSurveyResults();
        results.then((res) => {
          if (res) {
            isGotFilled = true;
            data = res;
          }
          myResolve("OK");
        });
      });
      await getResults.then((response) => {
        if (response === "OK" && isGotFilled) {
          for (const page of JSON.parse(survey.json).pages) {
            for (const elem of page.elements) {
              let question = model.getQuestionByName(elem.name);
              let name = elem.name;
              question.value = data[name];
            }
          }
        } else {
          const subscribedQuestion = model.getQuestionByName("wo");
          subscribedQuestion.value = term;
          const omsQuestion = model.getQuestionByName("oms");
          omsQuestion.value = oms_value;
          const stepQuestion = model.getQuestionByName("step");
          stepQuestion.value = step_value;
          const stationQuestion = model.getQuestionByName("station");
          stationQuestion.value = station_value;
          const useridQuestion = model.getQuestionByName("userid");
          useridQuestion.value = userid_value;
        }
      });
    }
  };
  useEffect(() => {
    fetchValues();
  }, [survey.json]);
  useEffect(() => {
    getSurvey();
  }, []);

  function createSurveyPdfModel(surveyModel: any) {
    console.log(surveyModel);

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
        <>
          <div
            className="modal-container "
            onClick={() => closePrintModal()}
          ></div>
          <div className="print-options-modal">
            <div>
              <div>
                <div>
                  <div className="flex">
                    <label
                      htmlFor="file-name"
                      style={{ fontWeight: "600", display: "block" }}
                    >
                      File Name
                    </label>
                    <input
                      type="text"
                      placeholder="Enter File Name"
                      style={{
                        marginTop: 5,
                        padding: "8px 4px",
                        width: "99%",
                      }}
                      value={fileName}
                      onChange={(e) => setFileName(e.target.value)}
                    />
                  </div>
                  <div style={{ marginTop: 20 }}>
                    <label htmlFor="paper-size" style={{ fontWeight: "600" }}>
                      Paper Size
                    </label>
                    <select
                      name="paper-size"
                      className="select-dropdown"
                      value={pdfOptions.format}
                      onChange={(e) =>
                        setPdfOptions({ ...pdfOptions, format: e.target.value })
                      }
                    >
                      <option value="a4">A4</option>
                      <option value="a0">A0</option>
                      <option value="a2">A2</option>
                      <option value="a3">A3</option>
                      <option value="b0">B0</option>
                      <option value="c0">C0</option>
                      <option value="dl">DL</option>
                      <option value="letter">Letter</option>
                      <option value="government-letter">
                        Government Letter
                      </option>
                      <option value="legal">Legal</option>
                      <option value="junior-legal">Junior Legal</option>
                      <option value="ledger">Ledger</option>
                      <option value="tabloid">Tabloid</option>
                      <option value="credit-card">Credit Card</option>
                    </select>
                  </div>
                  <div style={{ marginTop: 20 }}>
                    <label htmlFor="orientation" style={{ fontWeight: "600" }}>
                      Page Orientation
                    </label>
                    <select
                      name="orientation"
                      className="select-dropdown"
                      value={pdfOptions.orientation}
                      onChange={(e) =>
                        setPdfOptions({
                          ...pdfOptions,
                          orientation: e.target.value as "p" | "l" | undefined,
                        })
                      }
                    >
                      <option value="p">Portrait</option>
                      <option value="l">Landscape</option>
                    </select>
                  </div>
                  <div
                    style={{
                      marginTop: 20,
                    }}
                  >
                    <label htmlFor="margin" style={{ fontWeight: "600" }}>
                      Margins
                    </label>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginTop: 10,
                      }}
                    >
                      <input
                        type="number"
                        placeholder="Left"
                        className="w-20"
                        value={pdfOptions.margins.left}
                        onChange={(e) =>
                          setPdfOptions({
                            ...pdfOptions,
                            margins: {
                              ...pdfOptions.margins,
                              left: parseInt(e.target.value),
                            },
                          })
                        }
                      />
                      <input
                        type="number"
                        placeholder="Top"
                        className="w-20"
                        value={pdfOptions.margins.top}
                        onChange={(e) =>
                          setPdfOptions({
                            ...pdfOptions,
                            margins: {
                              ...pdfOptions.margins,
                              top: parseInt(e.target.value),
                            },
                          })
                        }
                      />
                      <input
                        type="number"
                        placeholder="Right"
                        className="w-20"
                        value={pdfOptions.margins.right}
                        onChange={(e) =>
                          setPdfOptions({
                            ...pdfOptions,
                            margins: {
                              ...pdfOptions.margins,
                              right: parseInt(e.target.value),
                            },
                          })
                        }
                      />
                      <input
                        type="number"
                        placeholder="Bottom"
                        className="w-20"
                        value={pdfOptions.margins.bot}
                        onChange={(e) =>
                          setPdfOptions({
                            ...pdfOptions,
                            margins: {
                              ...pdfOptions.margins,
                              bot: parseInt(e.target.value),
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                  <div
                    style={{
                      marginTop: 20,
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <div style={{ width: "20%" }}>
                      <label
                        htmlFor="font-size"
                        style={{ fontWeight: "600", display: "block" }}
                      >
                        Font Size
                      </label>
                      <input
                        type="number"
                        placeholder="Bottom"
                        style={{
                          marginTop: 10,
                          padding: "8px 4px",
                          width: "100%",
                        }}
                        value={pdfOptions.fontSize}
                        onChange={(e) =>
                          setPdfOptions({
                            ...pdfOptions,
                            fontSize: parseInt(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div style={{ width: "70%" }}>
                      <label htmlFor="font-size" style={{ fontWeight: "600" }}>
                        Font Style
                      </label>
                      <select
                        name="font-size"
                        className="select-dropdown"
                        style={{ marginTop: 10 }}
                        value={pdfOptions.fontName}
                        onChange={(e) =>
                          setPdfOptions({
                            ...pdfOptions,
                            fontName: e.target.value,
                          })
                        }
                      >
                        <option value="Helvetica">Helvetica</option>
                        <option value="Courier">Courier</option>
                        <option value="Times">Times</option>
                        <option value="Symbol">Symbol</option>
                        <option value="ZapfDingbats">ZapfDingbats</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="buttons">
                <button
                  className="modal-button cancle-button"
                  onClick={() => closePrintModal()}
                >
                  Cancel
                </button>
                <button className="modal-button" onClick={() => savePdf()}>
                  Export
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};
export default Run;
