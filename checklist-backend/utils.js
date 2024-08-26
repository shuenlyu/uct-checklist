const Logger = require("./logger");

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

const updateDataCollection = async (postId, new_data) => {
  try {
    // Delete existing data with the given postId
    await dbAdapter.query("DELETE FROM data_collection WHERE postid = ?", [
      postId,
    ]);

    // Insert new data into the data_collection table
    const insertPromises = new_data.map((data) => {
      return dbAdapter.query("INSERT INTO data_collection SET ?", data);
    });

    // Wait for all insert operations to complete
    await Promise.all(insertPromises);

    Logger.debug(`Data for postId ${postId} has been updated successfully.`);
  } catch (error) {
    Logger.error(`Error updating data for postId ${postId}:`, error.message);
    throw error;
  }
};

module.exports = {
  unpackSurvey,
  updateDataCollection,
};
