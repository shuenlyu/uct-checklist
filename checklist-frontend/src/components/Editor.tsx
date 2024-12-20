import React, { useEffect, useMemo, useState } from "react";
import { ComponentCollection, ItemValue, matrixDropdownColumnTypes, Serializer } from "survey-core";
import "survey-creator-core/survey-creator-core.css";
import { SurveyCreator, SurveyCreatorComponent } from "survey-creator-react";
import { useReduxDispatch } from "../redux";
import { useApi } from "../utils/api";
import Logger from "../utils/logger";

//import custom question type
import { log } from "console";
import { checklistContentFI_json } from "./custom_questions/checklistContentFI";
import { checklistHeaderFI_json } from "./custom_questions/checklistHeaderFI";
import { checklistHeaderShipKit_json } from "./custom_questions/checklistHeaderShipkit";
import { dc_predefined_json } from "./custom_questions/datacollection";
import { datacollectionFPY_json } from "./custom_questions/datacollectionFPY";

// Enable the File Upload type for use in matrix columns
matrixDropdownColumnTypes.file = {};

ComponentCollection.Instance.add(dc_predefined_json);
ComponentCollection.Instance.add(checklistHeaderFI_json);
ComponentCollection.Instance.add(checklistHeaderShipKit_json);
ComponentCollection.Instance.add(checklistContentFI_json);
ComponentCollection.Instance.add(datacollectionFPY_json);

const Editor = (params: { id: string }): React.ReactElement => {
  const { fetchData, postData } = useApi();
  const dispatch = useReduxDispatch();
  const [emailList, setEmailList] = useState<ItemValue[]>([]);
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

  //add useEffect for fetching the emailList for checklist 
  useEffect(()=>{
      const fetchEmailList = async () => {
          try {
              const response = await fetchData("/getEmailList");
              if (response.status !== 200){
                  throw new Error("Failed to fetch email list");
              }
              const emails = response.data;
              Logger.debug("emails: ", emails);
              setEmailList(emails.map((email:{Email:string}, index:number) => {
                return new ItemValue(index, email.Email);
              }));
              Logger.debug('emailList: ', emailList);
          } catch(error){
              console.error("fetchEmailList: ", error);
          }
      };
      fetchEmailList();

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
  creator.toolbox.changeCategory(
    "checklist_content_fi",
    "Text Input Questions"
  );
  creator.toolbox.changeCategory("datacollection_fpy", "Text Input Questions");

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
  let questionCount = 1;

  creator.onQuestionAdded.add(function (sender, options) {
    let opt = options.question;
    if (opt.getType() === "datacollection_header") {
      opt.name = "datacollection_header";
      opt.titleLocation = "hidden";
    } else if (opt.getType() === "checklist_header_fi") {
      opt.name = "checklist_header_fi";
      opt.titleLocation = "hidden";
    } else if (opt.getType() === "checklist_header_shipkit") {
      opt.name = "checklist_header_shipkit";
      opt.titleLocation = "hidden";
    } else if (opt.getType() === "checklist_content_fi") {
      opt.titleLocation = "hidden";
      opt.name = "checklist_content_fi-" + questionCount;
      questionCount++;
      // Assuming 'checkedby' is a dropdown inside 'checklist_content_fi'
      opt.checkedby = emailList;
    } else if (opt.getType() === "datacollection_fpy") {
      opt.titleLocation = "hidden";
      opt.name = "datacollection_fpy";
    }
  });

  return (
    <>
      <SurveyCreatorComponent creator={creator} />
    </>
  );
};

export default Editor;
