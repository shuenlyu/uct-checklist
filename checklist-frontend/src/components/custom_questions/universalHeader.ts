import { Serializer } from "survey-core";

export const universal_header_json = {
  name: "universal_header",
  title: "Universal Header",
  elementsJSON: [
    {
      type: "text",
      name: "wo",
      title: "WO",
      titleLocation: "left",
      maxWidth: "40%",
      visiable: true,
    },
    {
      type: "text",
      name: "oms",
      title: "OMS",
      titleLocation: "left",
      maxWidth: "40%",
      visible: true,
    },
    {
      type: "text",
      name: "step",
      title: "Step",
      titleLocation: "left",
      maxWidth: "40%",
      visible: true,
    },
    {
      type: "text",
      name: "station",
      title: "Station",
      titleLocation: "left",
      maxWidth: "40%",
      visible: true,
    },
    {
      type: "text",
      name: "omssn",
      title: "OMS SN",
      titleLocation: "left",
      maxWidth: "40%",
      visible: true,
    },
    {
      type: "text",
      name: "plant_code",
      title: "Plant Code",
      titleLocation: "left",
      maxWidth: "40%",
      visible: true,
    },
    {
      type: "text",
      name: "userid",
      title: "User ID",
      titleLocation: "left",
      maxWidth: "40%",
      visible: true,
    },
    //Adding new middle name question

    {
      type: "text",
      name: "toolid",
      title: "Tool ID",
      titleLocation: "left",
      maxWidth: "40%",
      visible: true,
    },
    {
      type: "text",
      inputType: "datetime-local",
      defaultValueExpression: "currentDate()",
      name: "date",
      title: "Date",
      visible: true,
      titleLocation: "left",
      maxWidth: "40%",
    },
  ],
  //SurveyJS calls this function one time on registing component, after creating "fullname" class.
  onInit() {
    Serializer.addProperties("universal_header", [
      {
        name: "showWo:boolean",
        default: true,
        category: "general",
        onSetValue: (question, value) => {
          question.contentPanel.getQuestionByName("wo").visible = value;
          question.setPropertyValue("showWo", value);
        },
      },
      {
        name: "showOms:boolean",
        default: true,
        category: "general",
        onSetValue: (question, value) => {
          question.contentPanel.getQuestionByName("oms").visible = value;
          question.setPropertyValue("showOms", value);
        },
      },
      {
        name: "showStep:boolean",
        default: true,
        category: "general",
        onSetValue: (question, value) => {
          question.contentPanel.getQuestionByName("step").visible = value;
          question.setPropertyValue("showStep", value);
        },
      },
      {
        name: "showStation:boolean",
        default: true,
        category: "general",
        onSetValue: (question, value) => {
          question.contentPanel.getQuestionByName("station").visible = value;
          question.setPropertyValue("showStation", value);
        },
      },
      {
        name: "showOmssn:boolean",
        default: true,
        category: "general",
        onSetValue: (question, value) => {
          question.contentPanel.getQuestionByName("omssn").visible = value;
          question.setPropertyValue("showOmssn", value);
        },
      },
      {
        name: "showPlantCode:boolean",
        default: true,
        category: "general",
        onSetValue: (question, value) => {
          question.contentPanel.getQuestionByName("plant_code").visible = value;
          question.setPropertyValue("showPlantCode", value);
        },
      },
      {
        name: "showUserId:boolean",
        default: true,
        category: "general",
        onSetValue: (question, value) => {
          question.contentPanel.getQuestionByName("userid").visible = value;
          question.setPropertyValue("showUserId", value);
        },
      },
      {
        name: "showToolid:boolean",
        default: true,
        category: "general",
        onSetValue: (question, value) => {
          question.contentPanel.getQuestionByName("toolid").visible = value;
          question.setPropertyValue("showToolid", value);
        },
      },
      {
        name: "showDate:boolean",
        default: true,
        category: "general",
        onSetValue: (question, value) => {
          question.contentPanel.getQuestionByName("date").visible = value;
          question.setPropertyValue("showDate", value);
        },
      },
    ]);
  },
  manageQuestionVisibility(question: any) {
    const allQuestions = question.contentPanel.questions;
    allQuestions.forEach((q: any, index: number) => {
      q.startWithNewLine = false;
    });
    const visibleQuestions = question.contentPanel.questions.filter(
      (q: any) => q.visible
    );
    visibleQuestions.forEach((q: any, index: number) => {
      q.startWithNewLine = index % 3 === 0;
    });
  },
  onLoaded(question: any) {
    question.contentPanel.questionTitleLocation = "left";
    question.contentPanel.questionTitleWidth = "85px";
    this.manageQuestionVisibility(question);
  },
  onPropertyChanged(question: any, propertyName: any, newValue: any) {
    if (
      [
        "showWo",
        "showOms",
        "showStep",
        "showStation",
        "showOmssn",
        "showPlantCode",
        "showUserId",
        "showToolid",
        "showDate",
      ].includes(propertyName)
    ) {
      this.manageQuestionVisibility(question);
    }
  },
};
