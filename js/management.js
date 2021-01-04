import * as QueryBuilder from "./model/QueryBuilder.js";
import * as Helpers from "./helpers.js";
import * as Exceptions from "./exceptions.js";
import * as StringBuilder from "./stringBuilding.js";

const api = axios.create({
  baseURL: "http://localhost:3000/",
  timeout: 4000
})

export const CHECKED_CHECKBOXES = {
  CBs: [],
  last: 0,
  selectedIds: function () { return CHECKED_CHECKBOXES.CBs.filter(x => document.getElementById(x).checked) }
};
export const WINDOWS_ID_SECTION = 'windowsSection'
export const WINDOWS_ID_EDIT_BUTTON = 'editWindowTitleB'
export const TABS_ID_CHECKBOX = 'tabCBox'
export const CHROMEID_NAME = 'currentChromeId'
var shift = false, checkedByScript = false, oneTabCheckedByScript = false, filterCaseSensitive = false;

//#region events callbacks
const onOneTabChange = e => {
  /*if(oneTabCheckedByScript) {
    oneTabCheckedByScript = false
    return
  }*/
  console.log('one tab checkbox changed to ', e.target.checked)

  //oneTabCheckedByScript = true
  if(e.target.id === 'oneTabCheckAside')
    document.getElementById('oneTabCheck').checked = e.target.checked
  else
    document.getElementById('oneTabCheckAside').checked = e.target.checked
  
  chrome.runtime.sendMessage({saveOneTab: e.target.checked}, () => {})
}
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
export const onTabCBChange = e => {
  if (checkedByScript)
    return;

  if (!shift) {
    CHECKED_CHECKBOXES.last = CHECKED_CHECKBOXES.CBs.indexOf(e.target.id);
  } else {
    checkedByScript = true;
    let pressedCbIdx = CHECKED_CHECKBOXES.CBs.indexOf(e.target.id)
    let diff = pressedCbIdx - CHECKED_CHECKBOXES.last
    let sign = diff > 0 ? 1 : -1
    
    //iterate forward or backward from last pressed checkbox to e.target pressed checkbox
    for(let i = CHECKED_CHECKBOXES.last; diff > 0 ? i <= pressedCbIdx : i >= pressedCbIdx; i += sign) {
      let current = document.getElementById(CHECKED_CHECKBOXES.CBs[i])
      if(current.checked !== e.target.checked)
        current.checked = e.target.checked
    }

    checkedByScript = false;
    CHECKED_CHECKBOXES.last = CHECKED_CHECKBOXES.CBs.indexOf(e.target.id);
  }
};
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
      Exceptions.databaseError("Error trying to get window's tab: ", err)
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
      Exceptions.databaseError("Error trying to get window's tab: ", err)
    })
}
const onLoadSelected = () => {

}
const onLoadSelectedNew = () => {

}
const onRemoveWindow = () => {
  let id = Helpers.getSelectedWindowId()
  if (!id) {
    Exceptions.exceptionNoWindowSelected()
    return
  }

  api.delete(`window?${CHROMEID_NAME}=${id}`)
    .then(res => {
      let myWindow = {[CHROMEID_NAME]: id}
      let section = document.getElementById(WINDOWS_ID_SECTION)
      section.removeChild(document.getElementById(StringBuilder.buildWindowHeaderButtonId(myWindow)))
      section.removeChild(document.getElementById(StringBuilder.buildWindowBodyParentId(myWindow)))
    })
    .catch(err => {Exceptions.databaseError('Error trying to remove window ', err)})
}
const onRemoveSelected = () => {

}
const onFilterKeyUp = e => {

}
//#endregion

//#region events
document.addEventListener("keydown", e => {
  if (e.key === "Shift" && !shift) {
    shift = true
  }
})
document.addEventListener("keyup", e => {
  if (e.key === "Shift" && shift) {
    shift = false
  }
})
window.onload = () => {
  document.getElementById("oneTabCheckAside").addEventListener("change", onOneTabChange)
  document.getElementById("loadWindowAside").addEventListener("click", onLoadWindow)
  document.getElementById("loadWindowNewAside").addEventListener("click", onLoadWindowNew)
  document.getElementById("loadSelAside").addEventListener("click", onLoadSelected)
  document.getElementById("loadSelNewAside").addEventListener("click", onLoadSelectedNew)
  document.getElementById("remWindowAside").addEventListener("click", onRemoveWindow)
  document.getElementById("remSelAside").addEventListener("click", onRemoveSelected)
  document.getElementById("filterInputAside").addEventListener("keyup", onFilterKeyUp)

  document.getElementById("oneTabCheck").addEventListener("change", onOneTabChange)
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
  document.getElementById(StringBuilder.buildWindowBodyParentId(myWindows[0])).classList.add('show')
  document.getElementById(StringBuilder.buildWindowCollapseButtonId(myWindows[0])).classList.remove('collapsed')
})();