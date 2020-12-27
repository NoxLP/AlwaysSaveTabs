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
const WINDOWS_ID_SECTION = 'windowsSection', WINDOWS_ID_EDIT_BUTTON = 'editWindowTitleB', TABS_ID_CHECKBOX = 'tabCBox', CHROMEID_NAME = 'currentChromeId'
var shift = false, checkedByScript = false, filterCaseSensitive = false;

//#region helpers
const buildWindowEditButtonId = myWindow => `${WINDOWS_ID_EDIT_BUTTON}${myWindow[CHROMEID_NAME]}`
const buildWindowEditInputGroupId = myWindow => `editWindowTitleIGroup${myWindow[CHROMEID_NAME]}`
const buildWindowEditInputId = myWindow => `editWindowTitleInput${myWindow[CHROMEID_NAME]}`
const buildWindowEditOkId = myWindow => `editWindowTitleOk${myWindow[CHROMEID_NAME]}`
const buildWindowCollapseButtonId = myWindow => `windowB${myWindow[CHROMEID_NAME]}`
const buildTabCheckboxId = tab => `${TABS_ID_CHECKBOX}${tab.tabId}`
const buildWindowBodyParentId = myWindow => `collapse${myWindow[CHROMEID_NAME]}`
const getWindowIdFromEditButton = button => button.id.slice(WINDOWS_ID_EDIT_BUTTON.length)

const createWindowHTML = myWindow => {
  let windowsSection = document.getElementById(WINDOWS_ID_SECTION)
  let editTitleButtonId = buildWindowEditButtonId(myWindow)
  let editTitleOkId = buildWindowEditOkId(myWindow)
  let headerId = `header${myWindow[CHROMEID_NAME]}`
  let collapseId = buildWindowBodyParentId(myWindow)
  let windowDiv = document.createElement('div')

  windowDiv.classList.add('accordion-item')
  windowDiv.innerHTML = `<h2 class="accordion-header d-flex flex-row border" id="${headerId}">
  <button class="btn mb-1" id="${editTitleButtonId}">
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="white" class="bi bi-pencil-square" viewBox="0 0 16 16">
      <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456l-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>
      <path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z"/>
    </svg>
  </button>
  <div class="input-group collapse" id="${buildWindowEditInputGroupId(myWindow)}">
    <input id="${buildWindowEditInputId(myWindow)}" type="text" class="form-control" placeholder="New window name" aria-label="New window name" aria-describedby="${editTitleOkId}">
    <button class="btn btn-outline-secondary" type="button" id="${editTitleOkId}">Ok</button>
  </div>
  <button id="${buildWindowCollapseButtonId(myWindow)}" class="accordion-button collapsed visible" type="button" data-bs-toggle="collapse" data-bs-target="#${collapseId}" aria-expanded="true" aria-controls="${collapseId}">
  <b>Ventana:</b>${myWindow.title ? '&emsp;' + myWindow.title : '&emsp;windowTitle&nbsp;'} - ${(new Date(myWindow.creationDate)).toLocaleDateString()}
  </button>
</h2>
<div id="${collapseId}" class="accordion-collapse collapse" aria-labelledby="${headerId}" data-bs-parent="#windowsSection">
  <div class="accordion-body">
      ${myWindow.tabs.map(tab => buildTabElements(tab)).join('\n')}
  </div>
</div>`
  windowsSection.appendChild(windowDiv)
  document.getElementById(editTitleButtonId).addEventListener('click', onEditWindowNameClick)
  document.getElementById(editTitleOkId).addEventListener('click', onEditWindowNameOk)
}
const buildTabElements = tab => {
  let domain = (tab.url.match(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n\?\=]+)/im) ||[])[0];
  let icon = "http://s2.googleusercontent.com/s2/favicons?domain_url=" + domain;

  return `<div class="row g-2 justify-content-between align-items-center ms-2 mt-3">
  <div class="col-1 d-flex justify-content-start flex-nowrap align-items-center form-check" style="width: 60px">
    <input class="form-check-input" type="checkbox" value="" id="${buildTabCheckboxId(tab)}">
    <img class="tab-icon ms-3" src="${icon}" alt="web icon">
  </div>
  <a class="text-truncate col-9 col-md-10 col-lg-7 col-xl-8 ms-lg-3 mb-1" target="_blank" href="${tab.url}">
    <span>${tab.title}</span>
  </a>
  <span class="domain-span show-when-desktop text-truncate col-3 ms-4">${domain}</span>
</div>`
}
//#endregion

//#region events callbacks
const onEditWindowNameClick = e => {
  console.log('edit button click', e.target.parentNode)
  let windowId = getWindowIdFromEditButton(e.target.parentNode)
  let myWindow = {[CHROMEID_NAME]: windowId}
  console.log(myWindow)
  console.log(buildWindowCollapseButtonId(myWindow))
  let windowCollButton = document.getElementById(buildWindowCollapseButtonId(myWindow))
  let windowInputGroup = document.getElementById(buildWindowEditInputGroupId(myWindow))

  if(!windowCollButton.classList.contains('collapse')) {
    windowCollButton.classList.add('collapse')
    windowInputGroup.classList.remove('collapse')
  } else {
    windowCollButton.classList.remove('collapse')
    windowInputGroup.classList.add('collapse')
  }
}
const onEditWindowNameOk = e => {

}
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
    myWindows = (await api.get('windows')).data
  } catch(err) {
    initialBDError()
    return
  }
  console.log(myWindows)
  myWindows.forEach(x => {
    createWindowHTML(x)
  })
  document.getElementById(buildWindowBodyParentId(myWindows[0])).classList.add('show')
  document.getElementById(buildWindowCollapseButtonId(myWindows[0])).classList.remove('collapsed')
})();