function SurveyManager(baseUrl, accessKey) {
  var self = this;
  self.availableSurveys = ko.observableArray();
  
  self.loadSurveys = function () {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", baseUrl + "/getImages");
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xhr.onload = function () {
      var result = xhr.response ? JSON.parse(xhr.response) : {};

      self.availableSurveys(
        Object.keys(result).map(function (key) {
          return {
            id: key,
            email: result[key].email || key,
            name:
              `${window.location.origin}/${result[key].name}` || result[key],
          };
        })
      );
    };
    xhr.send();
  };

  self.loadSurveys();
}

ko.applyBindings(
  new SurveyManager(""),
  document.getElementById("surveys-list")
);
