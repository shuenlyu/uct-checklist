export const weld3202_json = {
  name: "weldment_header",
  "title": "Weldment Header",
  titleLocation: "hidden",
  hideNumber: true,
  elementsJSON: [
    {
      "type": "text",
      "name": "uctPartNum",
      "title": "UCT Part Number"
    },
    {
      "type": "text",
      "name": "rev",
      "startWithNewLine": false,
      "title": "Rev"
    },
    {
      "type": "text",
      "name": "qty",
      "startWithNewLine": false,
      "title": "Qty"
    },
    {
      "type": "text",
      "name": "date",
      "startWithNewLine": false,
      "title": "Date",
      "maskType": "datetime",
      "maskSettings": {
        "pattern": "mm-dd-yyyy"
      } 
     },
    {
      "type": "radiogroup",
      "name": "shipTo",
      "title": "Shipt To",
      "choices": [
        {
          "value": "assembly",
          "text": "To Assembly"
        },
        {
          "value": "transfer",
          "text": "To Intersite Transfer"
        },
        {
          "value": "spareParts",
          "text": "Ship along/Spare parts"
        },
        {
          "value": "fastTrack",
          "text": "Fast Track"
        },
        {
          "value": "hardCap",
          "text": "Hard Cap/Plug Required"
        }
      ]
      },
      {
        "type": "boolean",
        "name": "fairRequires",
        "title": "If requires FAIR"
      },
      {
        "type": "text",
        "name": "woNum",
        "title": "WO Number"
      },
      {
        "type": "comment",
        "name": "customer",
        "title": "Customer"
      }
  ]
};
