import { Serializer } from "survey-core";

export const datacollectionFPY_json = {
  name: "datacollection_fpy",
  title: "Data Collection FPY",
  titleLocation: "hidden",
  hideNumber: true,
  elementsJSON: [
    {
      type: "boolean",
      name: "is_fpy",
      minWidth: "44%",
      maxWidth: "44%",
      title: "Will this impact the First Pass Yield (FPY)",
      isRequired: true,
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
    },
    {
      type: "text",
      name: "failed_reason",
      visible: false,
      minWidth: "100%",
      title: "Enter the Failed Description",
      requiredIf: "{composite.is_failed} = true",
      visibleIf: "{composite.is_failed} = true",
    },
  ],
  onInit() {
    Serializer.addProperty("datacollection_fpy", {
      name: "is_failed_title",
      displayName: "Question Title",
      type: "text",
      category: "general",
      default: "Please Modify Question Title",
    });
  },
  onLoaded(question: any) {
    this.changeSubQuestionTitle(question);
  },
  onPropertyChanged(question: any, propertyName: string) {
    if (propertyName === "is_failed_title") {
      this.changeSubQuestionTitle(question);
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
};
