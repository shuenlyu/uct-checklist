import React, { useEffect, useMemo } from "react";
import { useReduxDispatch } from "../redux";
import { SurveyCreator, SurveyCreatorComponent } from "survey-creator-react";
import "survey-creator-core/survey-creator-core.css";
import { useApi } from "../utils/api";

function envToBool(variable: string | undefined) {
  return variable === 'true'
}
const DEBUG = envToBool(process.env.REACT_APP_DEBUG);

const Editor = (params: { id: string }): React.ReactElement => {
  const { fetchData, postData } = useApi();
  const dispatch = useReduxDispatch();
  const creator = useMemo(() => {
    const options = {
      showLogicTab: true,
      showTranslationTab: true,
    };
    return new SurveyCreator(options);
  }, []);
  creator.isAutoSave = true;
  creator.saveSurveyFunc = async (
    saveNo: number,
    callback: (no: number, success: boolean) => void
  ) => {
    await postData("/changeJson", {
      id: params.id,
      json: creator.JSON,
      text: creator.text,
    });
    callback(saveNo, true);
  };

  useEffect(() => {
    (async () => {
      const response = await fetchData("/getSurvey?surveyId=" + params.id);
      if (DEBUG) console.log("surveyAction => ", response);
      if (typeof response.data.json === "object") {
        creator.JSON = response.data.json;
      } else {
        creator.text = response.data.json;
      }
    })();
  }, [dispatch, creator, params.id]);

  return (
    <>
      <SurveyCreatorComponent creator={creator} />
    </>
  );
};

export default Editor;
