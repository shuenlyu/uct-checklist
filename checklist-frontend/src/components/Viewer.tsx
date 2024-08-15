import React, { useEffect, useRef } from "react";
import "survey-analytics/survey.analytics.tabulator.css";
import { Model } from "survey-core";
import "tabulator-tables/dist/css/tabulator.css";
import { useApi } from "../utils/api";
import Logger from "../utils/logger";
const SurveyAnalyticsTabulator = require("survey-analytics/survey.analytics.tabulator");

const Viewer = (params: { id: string }): React.ReactElement => {
  const visContainerRef = useRef<HTMLDivElement>(null);
  const { fetchData } = useApi();

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
        var surveyAnalyticsTabulator = new SurveyAnalyticsTabulator.Tabulator(
          model,
          data.map((item: any) =>
            typeof item === "string" ? JSON.parse(item) : item
          )
        );
        surveyAnalyticsTabulator.render(visContainerRef.current);
      }
    })();
  }, [params.id]);

  return (
    <>
      <div className="sjs-results-content" ref={visContainerRef}>
        <div className="sjs-results-placeholder">
          <span>This survey doesn't have any answers yet</span>
        </div>
      </div>
    </>
  );
};

export default Viewer;
