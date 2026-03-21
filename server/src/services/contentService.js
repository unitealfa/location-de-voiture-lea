const defaultContent = require("../config/defaultContent");

function cloneValue(value) {
  return JSON.parse(JSON.stringify(value));
}

let siteContent = cloneValue(defaultContent);

function getHomePageContent() {
  return cloneValue(siteContent);
}

function replaceHomePageContent(nextContent) {
  siteContent = cloneValue(nextContent);
  return getHomePageContent();
}

module.exports = {
  getHomePageContent,
  replaceHomePageContent
};
