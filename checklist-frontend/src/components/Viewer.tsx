import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "survey-analytics/survey.analytics.tabulator.css";
import { Model } from "survey-core";
import "tabulator-tables/dist/css/tabulator.css";
import { useApi } from "../utils/api";
import Logger from "../utils/logger";
import Loading from "./Loading";
const SurveyAnalyticsTabulator = require("survey-analytics/survey.analytics.tabulator");

// define Row data data type
interface RowData {
  [key: string]: any;
}

//add button on result table details row and run that click when button is clicked
function gotoRun(
  row: RowData,
  id: string,
  navigate: (path: string, state?: any) => void
) {
  if (!row || Object.keys(row).length === 0) {
    console.error("Row data is empty, cannot navigate.");
    return;
  }
  console.log("row data: ", row);
  navigate(`/run/${id}`, { state: { result_id: row.id } });
  //go to Route /run/:id
}

const Viewer = (params: { id: string }): React.ReactElement => {
  const visContainerRef = useRef<HTMLDivElement>(null);
  const { fetchData } = useApi();
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const surveyAction = await fetchData("/getSurvey?surveyId=" + params.id);
      const survey = surveyAction.data;
      const resultsAction = await fetchData("/results?postId=" + params.id);
      const data = resultsAction.data;
      Logger.debug("results viewer data: ", data);
      if (data.length > 0 && visContainerRef.current) {
        var model = new Model(survey.json);
        visContainerRef.current.innerHTML = "";
        //Add submittedBy and createdAt to the model
        model.pages[0].addNewQuestion("text", "submittedBy", 0);
        model.pages[0].addNewQuestion("text", "createdAt", 1);
        model.pages[0].addNewQuestion("text", "id");
        const table_data = data.map((item: any) => {
          const json =
            typeof item.json === "string" ? JSON.parse(item.json) : item.json;
          return {
            createdAt: item.createdAt,
            submittedBy: item.submittedBy,
            id: item.id,
            ...json,
          };
        });
        var surveyAnalyticsTabulator = new SurveyAnalyticsTabulator.Tabulator(
          model,
          table_data
        );
        surveyAnalyticsTabulator.render(visContainerRef.current);
      }
    })();
  }, [params.id]);

  useEffect(() => {
    const extensionLocation = "details";
    const extensionName = "gotoRun";
    const extension = SurveyAnalyticsTabulator.TableExtensions.findExtension(
      extensionLocation,
      extensionName
    );
    if (!extension) {
      SurveyAnalyticsTabulator.TableExtensions.registerExtension({
        location: "details",
        name: extensionName,
        visibleIndex: 0,
        render: (table: any, opt: any) => {
          const btn = SurveyAnalyticsTabulator.DocumentHelper.createElement(
            "button",
            "sa-table__btn sa-table__btn--small",
            {
              innerHTML: "Run",
              onclick: (e: MouseEvent) => {
                e.stopPropagation();
                gotoRun(opt.row.getRowData(), params.id, navigate);
              },
            }
          );
          return btn;
        },
      });
    }
  }, []);

  return (
    <>
      <div className="sjs-results-content" ref={visContainerRef}>
        <div className="sjs-results-placeholder">
          <span>This survey doesn't have any answers yet</span>
          {/* <Loading /> */}
        </div>
      </div>
    </>
  );
};

export default Viewer;
