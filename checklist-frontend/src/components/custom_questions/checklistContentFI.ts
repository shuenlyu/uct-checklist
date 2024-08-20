import { Serializer } from "survey-core";

export const checklistContentFI_json = {
  name: "checklist_content_fi",
  title: "Checklist FI Content",
  titleLocation: "hidden",
  hideNumber: true,
  elementsJSON: [
    {
      type: "html",
      name: "item",
      minWidth: "10%",
      maxWidth: "10%",
      html: "<strong>1</strong>",
    },
    {
      type: "image",
      name: "photo",
      minWidth: "30%",
      maxWidth: "30%",
      startWithNewLine: false,
      imageLink: "",
      contentMode: "image",
      imageFit: "cover",
      imageHeight: "auto",
      imageWidth: "100%",
    },
    {
      type: "html",
      name: "inspection",
      minWidth: "15%",
      maxWidth: "15%",
      startWithNewLine: false,
      titleLocation: "hidden",
      hideNumber: true,
      defaultValue: "Check for BKM and ensure goof visibility",
      html: "Check for BKM and ensure goof visibility",
    },
    {
      type: "text",
      name: "inspectedby",
      minWidth: "15%",
      maxWidth: "15%",
      startWithNewLine: false,
      titleLocation: "hidden",
      hideNumber: true,
    },
    {
      type: "comment",
      name: "remarks",
      minWidth: "15%",
      maxWidth: "15%",
      startWithNewLine: false,
      titleLocation: "hidden",
      hideNumber: true,
      rows: 6,
    },
    {
      type: "dropdown",
      name: "checkedby",
      minWidth: "15%",
      maxWidth: "15%",
      startWithNewLine: false,
      titleLocation: "hidden",
      choices: [
        "AbuZarr.AB@uct.com",
        "aikchee.loh@uct.com",
        "Alifsyazwan.rosli@uct.com",
        "amarnath.selvan@uct.com",
      ],
      placeholder: "Select...",
    },
  ],
  onInit() {
    Serializer.addProperty("checklist_content_fi", {
      name: "itemno",
      displayName: "Item No.",
      type: "html",
      category: "general",
      default: "1",
    });
    Serializer.addProperty("checklist_content_fi", {
      name: "myImageLink",
      displayName: "Upload Image",
      type: "file",
      category: "general",
    });
    Serializer.addProperty("checklist_content_fi", {
      name: "inspection",
      displayName: "Inspection",
      type: "html",
      category: "general",
      default: "",
    });
    Serializer.addProperty("checklist_content_fi", {
      name: "inspectedby",
      displayName: "Inspected By",
      type: "text",
      category: "general",
      default: "",
    });
    Serializer.addProperty("checklist_content_fi", {
      name: "remarks",
      displayName: "Remarks",
      type: "comment",
      category: "general",
      default: "",
    });
    Serializer.addProperty("checklist_content_fi", {
      name: "checkedby",
      displayName: "Checked By List",
      type: "itemvalues",
      category: "general",
    });
  },
  onLoaded(question: any) {
    this.changeItemNo(question);
    this.changeImageLink(question);
    this.changeInspection(question);
    this.changeInspectedBy(question);
    this.changeRemarks(question);
    this.changeCheckedBy(question);
  },
  onPropertyChanged(question: any, propertyName: string, newValue: string) {
    if (propertyName === "itemno") {
      this.changeItemNo(question);
    } else if (propertyName === "myImageLink") {
      this.changeImageLink(question);
    } else if (propertyName === "inspection") {
      this.changeInspection(question);
    } else if (propertyName === "inspectedby") {
      this.changeInspectedBy(question);
    } else if (propertyName === "remarks") {
      this.changeRemarks(question);
    } else if (propertyName === "checkedby") {
      this.changeCheckedBy(question);
    }
  },
  changeItemNo(question: any) {
    const itemNoQuestion = question.contentPanel.getQuestionByName("item");
    if (!!itemNoQuestion) {
      itemNoQuestion.html = `<strong>${question.itemno}</strong>`;
    }
  },
  changeImageLink(question: any) {
    const imageLinkQuestion = question.contentPanel.getQuestionByName("photo");
    if (!!imageLinkQuestion) {
      imageLinkQuestion.imageLink = question.myImageLink;
    }
  },
  changeInspection(question: any) {
    const inspectionQuestion =
      question.contentPanel.getQuestionByName("inspection");
    if (!!inspectionQuestion) {
      inspectionQuestion.html = question.inspection;
    }
  },
  changeInspectedBy(question: any) {
    const inspectedByQuestion =
      question.contentPanel.getQuestionByName("inspectedby");
    if (!!inspectedByQuestion) {
      inspectedByQuestion.value = question.inspectedby;
    }
  },
  changeRemarks(question: any) {
    const remarksQuestion = question.contentPanel.getQuestionByName("remarks");
    if (!!remarksQuestion) {
      remarksQuestion.value = question.remarks;
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
