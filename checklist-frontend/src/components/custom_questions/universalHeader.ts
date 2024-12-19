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
    //SurveyJS will create a new class "fullname". We can add properties for this class onInit()
    // ?QUESTION Serializer is a SurveyJS class. What is the purpose of Serializer.addProperty()?
    Serializer.addProperty("universal_header", {
      name: "showWo:boolean",
      default: true,
      category: "general",
    });
    Serializer.addProperty("universal_header", {
      name: "showOms:boolean",
      default: true,
      category: "general",
    });
    Serializer.addProperty("universal_header", {
      name: "showStep:boolean",
      default: true,
      category: "general",
    });
    Serializer.addProperty("universal_header", {
      name: "showStation:boolean",
      default: true,
      category: "general",
    });
    Serializer.addProperty("universal_header", {
      name: "showOmssn:boolean",
      default: true,
      category: "general",
    });
    Serializer.addProperty("universal_header", {
      name: "showPlantCode:boolean",
      default: true,
      category: "general",
    });
    Serializer.addProperty("universal_header", {
      name: "showUserId:boolean",
      default: true,
      category: "general",
    });
    Serializer.addProperty("universal_header", {
      name: "showToolid:boolean",
      default: true,
      category: "general",
    });
    Serializer.addProperty("universal_header", {
      name: "showDate:boolean",
      default: true,
      category: "general",
    });
  },
  //SurveyJS calls this function after creating new question and loading it's properties from JSON
  //It calls in runtime and at design-time (after loading from JSON) and pass the current component/root question as parameter
  onLoaded(question: any) {
    question.contentPanel.questionTitleLocation = "left";
    question.contentPanel.questionTitleWidth = "85px";
    console.log("universalHeader onLoaded executed", question);
    this.changeWoVisibility(question);
    this.changeOmsVisibility(question);
    this.changeStepVisibility(question);
    this.changeStationVisibility(question);
    this.changeOmssnVisibility(question);
    this.changePlantCodeVisibility(question);
    this.changeUserIdVisibility(question);
    this.changeToolidVisibility(question);
    this.changeDateVisibility(question);
    const visibleQuestions = question.contentPanel.questions.filter(
      (q: any) => q.visible
    );
    visibleQuestions.forEach((q: any, index: number) => {
      q.startWithNewLine = index % 3 === 0;
    });
  },
  //SurveyJS calls this on a property change in the component/root question
  //It has three parameters that are self explained
  onPropertyChanged(question: any, propertyName: any, newValue: any) {
    console.log("onPropertyChanged", propertyName, newValue);
    if (propertyName == "showWo") {
      this.changeWoVisibility(question);
    } else if (propertyName == "showOms") {
      this.changeOmsVisibility(question);
    } else if (propertyName == "showStep") {
      this.changeStepVisibility(question);
    } else if (propertyName == "showStation") {
      this.changeStationVisibility(question);
    } else if (propertyName == "showOmssn") {
      this.changeOmssnVisibility(question);
    } else if (propertyName == "showPlantCode") {
      this.changePlantCodeVisibility(question);
    } else if (propertyName == "showUserId") {
      this.changeUserIdVisibility(question);
    } else if (propertyName == "showToolid") {
      this.changeToolidVisibility(question);
    } else if (propertyName == "showDate") {
      this.changeDateVisibility(question);
    }

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
      const visibleQuestions = question.contentPanel.questions.filter(
        (q: any) => q.visible
      );
      visibleQuestions.forEach((q: any, index: number) => {
        console.log("q, index", q.name, index);
        q.startWithNewLine = index % 3 === 0;
      });
    }
  },
  //The custom function that used in onLoaded and onPropertyChanged functions
  changeWoVisibility(question: any) {
    let wo = question.contentPanel.getQuestionByName("wo");
    if (!!wo) {
      wo.visible = question.showWo === true;
    }
  },
  changeOmsVisibility(question: any) {
    let oms = question.contentPanel.getQuestionByName("oms");
    if (!!oms) {
      oms.visible = question.showOms === true;
    }
  },
  changeStepVisibility(question: any) {
    let step = question.contentPanel.getQuestionByName("step");
    if (!!step) {
      step.visible = question.showStep === true;
    }
  },
  changeOmssnVisibility(question: any) {
    let omssn = question.contentPanel.getQuestionByName("omssn");
    if (!!omssn) {
      omssn.visible = question.showOmssn === true;
    }
  },
  changeStationVisibility(question: any) {
    let station = question.contentPanel.getQuestionByName("station");
    if (!!station) {
      station.visible = question.showStation === true;
    }
  },
  changePlantCodeVisibility(question: any) {
    let plantCode = question.contentPanel.getQuestionByName("plant_code");
    if (!!plantCode) {
      plantCode.visible = question.showPlantCode === true;
    }
  },
  changeToolidVisibility(question: any) {
    let toolid = question.contentPanel.getQuestionByName("toolid");
    if (!!toolid) {
      toolid.visible = question.showToolid === true;
    }
  },
  changeDateVisibility(question: any) {
    let date = question.contentPanel.getQuestionByName("date");
    if (!!date) {
      date.visible = question.showDate === true;
    }
  },

  changeUserIdVisibility(question: any) {
    let userId = question.contentPanel.getQuestionByName("userid");
    if (!!userId) {
      userId.visible = question.showUserId === true;
    }
  },
};
