import * as QueryBuilder from "./model/QueryBuilder.js";
import * as Helpers from "./helpers.js";
import * as Exceptions from "./exceptions.js";
import { buildWindowBodyParentId, buildWindowCollapseButtonId } from "./stringBuilding.js";

const api = axios.create({
  baseURL: "http://localhost:3000/",
  timeout: 4000
})

const CHECKED_CHECKBOXES = {
  CBs: [],
  last: 0,
  selectedIds: function () { return CHECKED_CHECKBOXES.CBs.filter(x => document.getElementById(x).checked) }
};
export const WINDOWS_ID_SECTION = 'windowsSection'
export const WINDOWS_ID_EDIT_BUTTON = 'editWindowTitleB'
export const TABS_ID_CHECKBOX = 'tabCBox'
export const CHROMEID_NAME = 'currentChromeId'
var shift = false, checkedByScript = false, filterCaseSensitive = false;

//#region events callbacks
export const onEditWindowNameClick = e => {
  console.log('edit button click', e.target.closest('button'))
  let windowId = getWindowIdFromElementId(e.target.closest('button'))
  let myWindow = { [CHROMEID_NAME]: windowId }
  console.log(document.getElementById(buildWindowCollapseButtonId(myWindow)))
  console.log(document.getElementById(buildWindowEditInputGroupId(myWindow)))
  console.log(myWindow)
  exchangeCollapsedWindowNameTitle(
    document.getElementById(buildWindowCollapseButtonId(myWindow)),
    document.getElementById(buildWindowEditInputGroupId(myWindow)))
}
export const onEditWindowNameOk = e => {
  console.log(e.target)
  let windowId = getWindowIdFromElementId(e.target)
  let myWindow = { [CHROMEID_NAME]: windowId }
  console.log(windowId, document.getElementById(buildWindowEditInputId(myWindow)))
  let input = document.getElementById(buildWindowEditInputId(myWindow))
  let name = input.value
  let collapseButton = buildWindowCollapseButtonId(myWindow)

  api.patch(`windowTitle?${CHROMEID_NAME}=${windowId}`, { title: name })
    .then(res => {
      console.log(`${windowId} window name succesfully updated to ${name}`)

      let collapseB = document.getElementById(collapseButton)
      collapseB.innerHTML = `<b>Ventana:</b>${name ? '&emsp;' + name : '&emsp;windowTitle&nbsp;'} - ${collapseB.innerText.match(/(?<=\-\s).*/)[0]}`
      input.value = ''
    })
    .catch(err => {
      console.error(`Error updating window name: \n${err}`)
    })

  exchangeCollapsedWindowNameTitle(
    document.getElementById(collapseButton),
    document.getElementById(buildWindowEditInputGroupId(myWindow)))
}
const onTabCBChange = e => {

}
const onLoadWindow = () => {
  let id = Helpers.getSelectedWindowId()
  if (!id) {
    Exceptions.exceptionNoWindowSelected()
    return
  }
  
  console.log('on load window', id)
  api.get(`window?${CHROMEID_NAME}=${id}`)
    .then(res => {
      console.log('window get: ', res.data)
      res.data[0].tabs.forEach(tab => {
        chrome.tabs.create(Helpers.getChromeTabFromBDTab(tab), x => console.log("Tab loaded: ", x))
      })
    })
    .catch(err => {
      console.log("Error trying to get window's tab: ", err)
    })
}
const onLoadWindowNew = () => {
  let id = Helpers.getSelectedWindowId()
  if (!id) {
    Exceptions.exceptionNoWindowSelected()
    return
  }
  
  console.log('on load window', id)
  api.get(`window?${CHROMEID_NAME}=${id}`)
    .then(res => {
      console.log('window get: ', res.data)
      
      chrome.windows.create({ focused: true }, w => {
        console.log('window get: ', res.data)
        res.data[0].tabs.forEach(tab => {
          chrome.tabs.create(Helpers.getChromeTabFromBDTab(tab, w.id), 
            x => console.log("Tab loaded: ", x))
          })
      })
    })
    .catch(err => {
      console.log("Error trying to get window's tab: ", err)
    })
}
const onLoadSelected = () => {

}
const onLoadSelectedNew = () => {

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
  document.getElementById("loadWindowNew").addEventListener("click", onLoadWindowNew)
  document.getElementById("loadSel").addEventListener("click", onLoadSelected)
  document.getElementById("loadSelNew").addEventListener("click", onLoadSelectedNew)
  document.getElementById("remWindow").addEventListener("click", onRemoveWindow)
  document.getElementById("remSel").addEventListener("click", onRemoveSelected)
  document.getElementById("filterInput").addEventListener("keyup", onFilterKeyUp)
}
//#endregion

(async function buildHTML() {
  let myWindows;
  try {
    myWindows = (await api.get('windows')).data
  } catch (err) {
    Exceptions.exceptionInitialBD()
    return
  }
  console.log(myWindows)
  myWindows.forEach(x => {
    Helpers.createWindowHTML(x)
  })
  document.getElementById(buildWindowBodyParentId(myWindows[0])).classList.add('show')
  document.getElementById(buildWindowCollapseButtonId(myWindows[0])).classList.remove('collapsed')
})();