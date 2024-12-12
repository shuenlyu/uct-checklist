import { Serializer } from "survey-core";

export const universal_content_json = {
  name: "universal_content",
  title: "Universal Content",
  elementsJSON: [
    {
      type: "boolean",
      name: "is_fpy",
      minWidth: "44%",
      maxWidth: "44%",
      title: "Will this impact the First Pass Yield (FPY)",
      isRequired: false,
      readOnly: true,
      visiable: true,
    },
    {
      type: "boolean",
      name: "is_failed",
      minWidth: "55%",
      maxWidth: "55%",
      startWithNewLine: false,
      //   title:" Any test failed for Running beam cal ( Select Fail if any one of the test fail) *",
      title: "",
      isRequired: true,
      labelTrue: "Fail",
      labelFalse: "Pass",
      visiable: true,
    },
    {
      type: "text",
      name: "failed_reason",
      visible: false,
      minWidth: "100%",
      title: "Enter the Failed Description",
      requiredIf: "{composite.is_failed} = true",
      visibleIf: "{composite.is_failed} = true",
      visiable: true,
    },
    {
      type: "text",
      name: "inspectedby",
      // minWidth: "15%",
      // maxWidth: "15%",
      startWithNewLine: true,
      titleLocation: "hidden",
      hideNumber: true,
      visiable: true,
    },
    {
      type: "dropdown",
      name: "checkedby",
      // minWidth: "15%",
      // maxWidth: "15%",
      startWithNewLine: false,
      titleLocation: "hidden",
      allowClear: false,
      choices: [
        "AbuZarr.AB@uct.com",
        "aikchee.loh@uct.com",
        "Alifsyazwan.rosli@uct.com",
        "amarnath.selvan@uct.com",
      ],
      placeholder: "Select...",
      visiable: true,
    },
  ],
  onInit() {
    Serializer.addProperty("universal_content", {
      name: "is_failed_title",
      displayName: "Question Title",
      type: "text",
      category: "general",
      default: "Please Modify Question Title",
    });
    Serializer.addProperty("universal_content", {
      name: "is_fpy_default",
      displayName: "Is FPY",
      type: "boolean",
      category: "general",
      default: false,
    });
    Serializer.addProperty("universal_content", {
      name: "showFPY:boolean",
      default: true,
      category: "general",
    });
    Serializer.addProperty("universal_content", {
      name: "showCheckedBy:boolean",
      default: true,
      category: "general",
    });
    Serializer.addProperty("universal_content", {
      name: "showInspectedBy:boolean",
      default: true,
      category: "general",
    });
    Serializer.addProperty("universal_content", {
      name: "checkedby",
      displayName: "Checked By List",
      type: "itemvalues",
      category: "general",
    });
  },
  onLoaded(question: any) {
    this.changeSubQuestionTitle(question);
    this.changeIsFpy(question);
    this.changeFPYVisibility(question);
    this.changeCheckedByVisibility(question);
    this.changeInspectedByVisibility(question);
    this.changeCheckedBy(question);
  },
  onPropertyChanged(question: any, propertyName: string) {
    if (propertyName === "is_failed_title") {
      this.changeSubQuestionTitle(question);
    } else if (propertyName === "is_fpy_default") {
      this.changeIsFpy(question);
    } else if (propertyName === "showFPY") {
      this.changeFPYVisibility(question);
    } else if (propertyName === "showCheckedBy") {
      this.changeCheckedByVisibility(question);
    } else if (propertyName === "showInspectedBy") {
      this.changeInspectedByVisibility(question);
    } else if (propertyName === "checkedby") {
      this.changeCheckedBy(question);
    }
  },
  onValueChanged(question: any, name: any, newValue: any) {
    const failedReason =
      question.contentPanel.getQuestionByName("failed_reason");
    const is_failedQuestion =
      question.contentPanel.getQuestionByName("is_failed");

    if (name === "is_failed") {
      if (newValue === false && !!failedReason) {
        failedReason.value = "";
      }
      if (!!is_failedQuestion && is_failedQuestion.value === false) {
        failedReason.value = "";
      }
    }
  },
  changeSubQuestionTitle(question: any) {
    const subQuestion = question.contentPanel.getQuestionByName("is_failed");
    const failedReason =
      question.contentPanel.getQuestionByName("failed_reason");

    if (!!subQuestion) {
      subQuestion.title = question.is_failed_title;
      if (subQuestion.value === false && !!failedReason) {
        failedReason.value = "";
      }
    }
  },
  changeIsFpy(question: any) {
    const isFpyQuestion = question.contentPanel.getQuestionByName("is_fpy");
    if (!!isFpyQuestion) {
      isFpyQuestion.defaultValue = question.is_fpy_default;
    }
  },
  changeFPYVisibility(question: any) {
    let fpy = question.contentPanel.getQuestionByName("is_fpy");
    let isFailed = question.contentPanel.getQuestionByName("is_failed");
    let failedReason = question.contentPanel.getQuestionByName("failed_reason");
    if (!!fpy) {
      fpy.visible = question.showFPY === true;
      isFailed.visible = question.showFPY === true;
      failedReason.visible = question.showFPY === true;
    }
  },
  changeCheckedByVisibility(question: any) {
    let checkedBy = question.contentPanel.getQuestionByName("checkedby");
    if (!!checkedBy) {
      checkedBy.visible = question.showCheckedBy === true;
    }
  },
  changeInspectedByVisibility(question: any) {
    let inspectedBy = question.contentPanel.getQuestionByName("inspectedby");
    if (!!inspectedBy) {
      inspectedBy.visible = question.showInspectedBy === true;
    }
  },
  changeCheckedBy(question: any) {
    const checkedByQuestion =
      question.contentPanel.getQuestionByName("checkedby");
    if (!!checkedByQuestion) {
      checkedByQuestion.choices = question.checkedby;
    }
  },
};
