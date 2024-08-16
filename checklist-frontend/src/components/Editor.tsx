import React, { useEffect, useMemo } from "react";
import { ComponentCollection, matrixDropdownColumnTypes } from "survey-core";
import "survey-creator-core/survey-creator-core.css";
import { SurveyCreator, SurveyCreatorComponent } from "survey-creator-react";
import { useReduxDispatch } from "../redux";
import { useApi } from "../utils/api";
import Logger from "../utils/logger";

//import custom question type
import { checklistHeaderFI_json } from "./custom_questions/checklistHeaderFI";
import { checklistHeaderShipKit_json } from "./custom_questions/checklistHeaderShipkit";
import { dc_predefined_json } from "./custom_questions/datacollection";

// Enable the File Upload type for use in matrix columns
matrixDropdownColumnTypes.file = {};

ComponentCollection.Instance.add(dc_predefined_json);
ComponentCollection.Instance.add(checklistHeaderFI_json);
ComponentCollection.Instance.add(checklistHeaderShipKit_json);

const Editor = (params: { id: string }): React.ReactElement => {
  const { fetchData, postData } = useApi();
  const dispatch = useReduxDispatch();
  const creator = useMemo(() => {
    const options = {
      showLogicTab: true,
      showThemeTab: true,
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

  // // create savetheme function
  creator.saveThemeFunc = async (
    saveNo: number,
    callback: (no: number, success: boolean) => void
  ) => {
    await postData("/changeTheme", {
      id: params.id,
      name: creator.theme.themeName,
      theme: creator.theme,
    });

    Logger.debug("creator theme => ", creator.theme);
    callback(saveNo, true);
  };

  useEffect(() => {
    (async () => {
      const response = await fetchData("/getSurvey?surveyId=" + params.id);
      Logger.debug("surveyAction => ", response);
      if (typeof response.data.json === "object") {
        Logger.debug("surveyAction response is json object!!");
        creator.JSON = response.data.json;
      } else {
        Logger.debug("surveyAction response is text!!");
        creator.text = response.data.json;
      }
    })();
  }, [dispatch, creator, params.id]);

  useEffect(() => {
    (async () => {
      const response = await fetchData("/getTheme?surveyId=" + params.id);
      Logger.debug("themeAction => ", response);
      Logger.debug("themeAction response is :", typeof response.data.theme);
      if (response.data.theme) {
        const theme = JSON.parse(response.data.theme);
        if (
          creator.themeEditor.availableThemes.indexOf(theme.themeName) === -1
        ) {
          creator.themeEditor.addTheme(theme);
          Logger.debug("theme added to creator.ThemeEditor => ", theme);
          creator.theme = theme;
        } else {
          creator.theme = theme;
        }
      }
    })();
  }, [dispatch, creator, params.id]);

  //modify the added question type into text input question category
  creator.toolbox.forceCompact = false;
  creator.toolbox.changeCategory(
    "datacollection_header",
    "Text Input Questions"
  );
  creator.toolbox.changeCategory("checklist_header_fi", "Text Input Questions");
  creator.toolbox.changeCategory(
    "checklist_header_shipkit",
    "Text Input Questions"
  );

  //define the properties to be shown for datacollection_header question type
  // const propertiesToShowInPredefined = [
  //   // "name",
  //   "title",
  // ];
  //hide properties for custom component
  creator.onShowingProperty.add((sender, options) => {
    if (
      options.obj.getType() === "datacollection_header" ||
      options.obj.getType() === "checklist_header_fi" ||
      options.obj.getType() === "checklist_header_shipkit"
    ) {
      options.canShow = false;
      // propertiesToShowInPredefined.indexOf(options.property.name) > -1;
    }
  });

  // change the default name to datacollection_header when create
  creator.onQuestionAdded.add(function (sender, options) {
    let opt = options.question;
    if (opt.getType() === "datacollection_header") {
      opt.name = "datacollection_header";
      opt.title = "Data Collection Header";
      opt.titleLocation = "hidden";
    } else if (opt.getType() === "checklist_header_fi") {
      opt.name = "checklist_header_fi";
      opt.title = "Checklist-FI Header";
      opt.titleLocation = "hidden";
    } else if (opt.getType() === "checklist_header_shipkit") {
      opt.name = "checklist_header_shipkit";
      opt.title = "Checklist-Shipkit Header";
      opt.titleLocation = "hidden";
    }
  });
  return (
    <>
      <SurveyCreatorComponent creator={creator} />
    </>
  );
};

export default Editor;
