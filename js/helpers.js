import { WINDOWS_ID_SECTION, CHROMEID_NAME, onEditWindowNameClick, onEditWindowNameOk } from "./management.js";
import * as StringBuilding from "./stringBuilding.js";

export const createWindowHTML = myWindow => {
  let windowsSection = document.getElementById(WINDOWS_ID_SECTION)
  windowsSection.innerHTML = ''
  let editTitleButtonId = StringBuilding.buildWindowEditButtonId(myWindow)
  let editTitleOkId = StringBuilding.buildWindowEditOkId(myWindow)
  let headerId = `header${myWindow[CHROMEID_NAME]}`
  let collapseId = StringBuilding.buildWindowBodyParentId(myWindow)
  let windowDiv = document.createElement('div')

  windowDiv.classList.add('accordion-item')
  windowDiv.innerHTML = `<h2 class="accordion-header d-flex flex-row border" id="${headerId}">
  <button class="btn mb-1" id="${editTitleButtonId}">
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="white" class="bi bi-pencil-square" viewBox="0 0 16 16">
      <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456l-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>
      <path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z"/>
    </svg>
  </button>
  <div class="input-group collapse" id="${StringBuilding.buildWindowEditInputGroupId(myWindow)}">
    <input id="${StringBuilding.buildWindowEditInputId(myWindow)}" type="text" class="form-control" placeholder="New window name" aria-label="New window name" aria-describedby="${editTitleOkId}">
    <button class="btn btn-outline-secondary" type="button" id="${editTitleOkId}" style="color: white;">Ok</button>
  </div>
  <button id="${StringBuilding.buildWindowCollapseButtonId(myWindow)}" class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#${collapseId}" aria-expanded="true" aria-controls="${collapseId}">
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
export const buildTabElements = tab => {
  let domain = (tab.url.match(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n\?\=]+)/im) || [])[0];
  let icon = "http://s2.googleusercontent.com/s2/favicons?domain_url=" + domain;

  return `<div class="row g-2 justify-content-between align-items-center ps-2 pb-1 mt-1">
  <div class="col-1 d-flex justify-content-start flex-nowrap align-items-center form-check" style="width: 60px">
    <input class="form-check-input" type="checkbox" value="" id="${StringBuilding.buildTabCheckboxId(tab)}">
    <img class="tab-icon ms-3" src="${icon}" alt="web icon">
  </div>
  <a class="text-truncate col-9 col-md-10 col-lg-7 col-xl-8 ms-lg-3 mb-1" target="_blank" href="${tab.url}">
    <span>${tab.title}</span>
  </a>
  <span class="domain-span show-when-desktop text-truncate col-3 ms-4">${domain}</span>
</div>`
}
export const exchangeCollapsedWindowNameTitle = (windowCollButton, windowInputGroup) => {
  if (!windowCollButton.classList.contains('collapse')) {
    windowCollButton.classList.add('collapse')
    windowInputGroup.classList.remove('collapse')
  } else {
    windowCollButton.classList.remove('collapse')
    windowInputGroup.classList.add('collapse')
  }
}
export const getSelectedWindowId = () => {
  let windows = document.querySelectorAll('.accordion-button:not(.collapsed)')
  if (windows.length === 0)
    return null

  return StringBuilding.getWindowIdFromElementId(windows[0])
}
export const getChromeTabFromBDTab = (bdTab, windowId) => {
  let tab = {
    url: bdTab.url,
    pinned: bdTab.pined,
    selected: bdTab.selected
  }
  if(windowId)
    tab['windowId'] = windowId
  return tab
}