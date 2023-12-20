var surveyName = "";
function setSurveyName(name) {
  var $titleTitle = jQuery("#sjs_survey_creator_title_show");
  $titleTitle.find("span:first-child").text(name);
}
function startEdit() {
  var $titleSurveyCreator = jQuery("#sjs_survey_creator_title_edit");
  var $titleTitle = jQuery("#sjs_survey_creator_title_show");
  $titleTitle.hide();
  $titleSurveyCreator.show();
  $titleSurveyCreator.find("input")[0].value = surveyName;
  $titleSurveyCreator.find("input").focus();
}
function cancelEdit() {
  var $titleSurveyCreator = jQuery("#sjs_survey_creator_title_edit");
  var $titleTitle = jQuery("#sjs_survey_creator_title_show");
  $titleSurveyCreator.hide();
  $titleTitle.show();
}
function postEdit() {
  cancelEdit();
  var oldName = surveyName;
  var $titleSurveyCreator = jQuery("#sjs_survey_creator_title_edit");
  surveyName = $titleSurveyCreator.find("input")[0].value;
  setSurveyName(surveyName);
  jQuery
    .get("/changeName?id=" + surveyId + "&name=" + surveyName, function (data) {
      surveyId = data.Id;
    })
    .fail(function (error) {
      surveyName = oldName;
      setSurveyName(surveyName);
      alert(JSON.stringify(error));
    });
}

function getParams() {
  var url = window.location.href
    .slice(window.location.href.indexOf("?") + 1)
    .split("&");
  var result = {};
  url.forEach(function (item) {
    var param = item.split("=");
    result[param[0]] = param[1];
  });
  return result;
}

Survey.dxSurveyService.serviceUrl = "";

const creatorOptions = {
  showLogicTab: true,
  isAutoSave: true
};


var accessKey = "";
var surveyCreator = new surveyCreator.SurveyCreator("survey-creator-container");
//var surveyCreator = new SurveyCreator.SurveyCreator(creatorOptions);
var surveyId = decodeURI(getParams()["id"]);
surveyName = decodeURI(getParams()["name"]);
surveyCreator.loadSurvey(surveyId);

surveyCreator.saveSurveyFunc = function (saveNo, callback) {
  var xhr = new XMLHttpRequest();
  xhr.open(
    "POST",
    Survey.dxSurveyService.serviceUrl + "/changeJson?accessKey=" + accessKey
  );
  xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
  xhr.onload = function () {
    var result = xhr.response ? JSON.parse(xhr.response) : null;
    if (xhr.status === 200) {
      callback(saveNo, true);
    }
  };
  console.log(surveyCreator.text);
  let tempContent = JSON.parse(surveyCreator.text);
  //tempContent["navigateToUrl"] = `${window.location.origin}/thankyou.html`;
  tempContent["pages"] = tempContent["pages"].map((ite) => {
    //console.log(ite["elements"]);
    ite["elements"] = ite["elements"].map((item) => {
      if (item.type == "file") {
        item = {
          ...item,
          storeDataAsText: false,
          allowMultiple: true,
        };
      }
      return item;
    });

    return ite;
  });

  xhr.send(
    JSON.stringify({
      Id: surveyId,
      Json: tempContent,
      Text: tempContent,
    })
  );
};
surveyCreator.isAutoSave = true;
surveyCreator.showState = true;
surveyCreator.showOptions = true;

setSurveyName(surveyName);
