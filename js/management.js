import * as QueryBuilder from "./model/QueryBuilder.js";

const api = axios.create({
  baseURL: "http://localhost:3000/",
  timeout: 4000
})

const CHECKED_CHECKBOXES = {
  CBs: [],
  last: 0,
  selectedIds: function () { return CHECKED_CHECKBOXES.CBs.filter(x => document.getElementById(x).checked) }
};
const WINDOWS_SECTION_ID = 'windowsSection'
var shift = false, checkedByScript = false, filterCaseSensitive = false;

//#region helpers
/*
<div class="accordion-item">
  <h2 class="accordion-header" id="header145">
    <button id="window145" class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapse145" aria-expanded="true" aria-controls="collapse145">
      Nombre ventana - fecha ventana
    </button>
  </h2>
  <div class="d-flex flex-column">
    <div class="d-flex flex-row justify-content-between align-items-center mx-2">
      <div class="form-check">
        <input class="form-check-input" type="checkbox" value="" id="tab652CBox">
      </div>
      <img class="img-thumbnail ms-3" src="#" alt="web icon">
      <a class="flex-grow-1" target="_blank" href="${tab.url}">
        <span class="ms-3">tab.title</span>
        <span class="ms-3">domain</span>
      </a>
      <br>
    </div>
  </div>
</div>
*/
const createWindowHTML = myWindow => {
  let windowsSection = document.getElementById(WINDOWS_SECTION_ID)
  
}
const createTabElementIn = (element, tab) => {

}
//#endregion

//#region events callbacks
const onTabCBChange = e => {

}
const onLoadWindow = () => {

}
const onLoadSelected = () => {

}
const onRemoveWindow = () => {

}
const onRemoveSelected = () => {

}
const onFilterKeyUp = e => {

}
//#endregion

//#region events
document.addEventListener("keydown", e => {
  if (e.key === "Shift") {
    shift = true
  }
})
document.addEventListener("keyup", e => {
  if (e.key === "Shift") {
    shift = false
  }
})
window.onload = () => {
  document.getElementById("loadWindow").addEventListener("click", onLoadWindow)
  document.getElementById("loadSel").addEventListener("click", onLoadSelected)
  document.getElementById("remWindow").addEventListener("click", onRemoveWindow)
  document.getElementById("remSel").addEventListener("click", onRemoveSelected)
  document.getElementById("filterInput").addEventListener("keyup", onFilterKeyUp)
}
//#endregion

const initialBDError = () => {
  //************************* TODO ******************************

}
(async function buildHTML() {
  let myWindows;
  try {
    myWindows = api.get('windows')
  } catch(err) {
    initialBDError()
    return
  }
  
  myWindows.forEach(x => {
    createWindowHTML(x)
  })
})();