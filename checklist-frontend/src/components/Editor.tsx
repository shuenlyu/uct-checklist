import React, { useEffect, useMemo } from "react";
import { useReduxDispatch } from "../redux";
import { SurveyCreator, SurveyCreatorComponent } from "survey-creator-react";
import { ComponentCollection, Serializer } from "survey-core";
import "survey-creator-core/survey-creator-core.css";
import { useApi } from "../utils/api";
import Logger from "../utils/logger";

ComponentCollection.Instance.add({
  name: "predefinedfields",
  title: "Predefined Fields",
  elementsJSON: [
    {
      type: "text",
      name: "wo",
      title: "WO",
      isRequired: true
    },
    {
      type: "text",
      name: "oms",
      title: "OMS",
      isRequired: true
    },
    {
      type: "text",
      name: "step",
      title: "Step",
      isRequired: true
    },
    {
      type: "text",
      name: "station",
      title: "Station",
      isRequired: true
    },
    {
      type: "text",
      name: "userid",
      title: "User ID",
      isRequired: true
    }
  ],
});

//define the properties to be shown for predefinedFields question type
const propertiesToShowInPredefined = [
  // "name",
  "title"
];

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

  //hide properties for custom component
  creator.onShowingProperty.add((sender, options) => {
    if (options.obj.getType() === "predefinedfields") {
      options.canShow = propertiesToShowInPredefined.indexOf(options.property.name) > -1;
    }
  });

  //change the default name to predefinedfields when create
  creator.onQuestionAdded.add(function (sender, options) {
    let opt = options.question;
    if (opt.getType() === 'predefinedfields') {
      opt.name = "predefinedfields";
      opt.title = "Predefined Fields"
    }
  });

  return (
    <>
      <SurveyCreatorComponent creator={creator} />
    </>
  );
};

export default Editor;
