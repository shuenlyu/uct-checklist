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
      // showThemeTab: true,
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
      Logger.debug("surveyAction => ", response);
      if (typeof response.data.json === "object") {
        creator.JSON = response.data.json;
      } else {
        creator.text = response.data.json;
      }
    })();
  }, [dispatch, creator, params.id]);

  //modify the added question type into text input question category
  creator.toolbox.forceCompact = false;
  creator.toolbox.changeCategory("predefinedfields", "Text Input Questions");
  creator.toolbox.changeCategory("checklist_header_FI", "Text Input Questions");
  creator.toolbox.changeCategory(
    "checklist_header_shipkit",
    "Text Input Questions"
  );

  //define the properties to be shown for predefinedFields question type
  // const propertiesToShowInPredefined = [
  //   // "name",
  //   "title",
  // ];
  //hide properties for custom component
  creator.onShowingProperty.add((sender, options) => {
    if (
      options.obj.getType() === "predefinedfields" ||
      options.obj.getType() === "checklist_header_FI" ||
      options.obj.getType() === "checklist_header_shipkit"
    ) {
      options.canShow = false;
      // propertiesToShowInPredefined.indexOf(options.property.name) > -1;
    }
  });

  // change the default name to predefinedfields when create
  creator.onQuestionAdded.add(function (sender, options) {
    let opt = options.question;
    if (opt.getType() === "predefinedfields") {
      opt.name = "predefinedfields";
      opt.title = "Predefined Fields";
      opt.titleLocation = "hidden";
    } else if (opt.getType() === "checklist_header_FI") {
      opt.name = "checklist_header_FI";
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
