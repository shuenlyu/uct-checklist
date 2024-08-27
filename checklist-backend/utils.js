function unpackSurvey(survey) {
  const unpacked = {};

  // Loop through each page in the survey
  survey.pages.forEach((page) => {
    // Loop through each element in the page
    page.elements.forEach((element) => {
      // Add the element to the top-level of the new object, using its name as the key
      unpacked[element.name] = element;
    });
  });

  return unpacked;
}

module.exports = {
  unpackSurvey,
};
