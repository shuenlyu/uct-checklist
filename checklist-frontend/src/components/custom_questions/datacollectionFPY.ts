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
      name: "sub_q1",
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
      requiredIf: "{composite.sub_q1} = true",
      visibleIf: "{composite.sub_q1} = true",
    },
  ],
  onInit() {
    Serializer.addProperty("datacollection_fpy", {
      name: "question_title",
      displayName: "Question Title",
      type: "text",
      category: "general",
      default: "Question Title",
    });
  },
  onLoaded(question: any) {
    this.changeSubQuestionTitle(question);
  },
  onPropertyChanged(question: any, propertyName: string) {
    if (propertyName === "question_title") {
      this.changeSubQuestionTitle(question);
    }
  },
  changeSubQuestionTitle(question: any) {
    const subQuestion = question.contentPanel.getQuestionByName("sub_q1");

    if (!!subQuestion) {
      subQuestion.title = question.question_title;
    }
  },
};
