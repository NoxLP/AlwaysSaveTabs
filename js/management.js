import * as QueryBuilder from "./model/QueryBuilder.js";
import * as Helpers from "./helpers.js";
import * as Exceptions from "./exceptions.js";
import * as StringBuilder from "./stringBuilding.js";

const api = axios.create({
  baseURL: "http://localhost:3000/",
  timeout: 4000
})

export const tabsCheckboxes = {
  CBs: [],
  last: 0,
  selectedIds: function () { 
    return tabsCheckboxes.CBs.filter(x => {
      let cb = document.getElementById(x)
      return cb && cb.checked
    })
  }
};
export const WINDOWS_ID_SECTION = 'windowsSection'
export const WINDOWS_ID_EDIT_BUTTON = 'editWindowTitleB'
export const TABS_ID_CHECKBOX = 'tabCBox'
export const TABS_DIV_CLASS = 'tab-div'
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
  if (e.target.id === 'oneTabCheckAside')
    document.getElementById('oneTabCheck').checked = e.target.checked
  else
    document.getElementById('oneTabCheckAside').checked = e.target.checked

  chrome.runtime.sendMessage({ saveOneTab: e.target.checked }, () => { })
}
export const onEditWindowNameClick = e => {
  console.log('edit button click', e.target.closest('button'))
  let windowId = getWindowOrTabIdFromElementId(e.target.closest('button'))
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
  let windowId = getWindowOrTabIdFromElementId(e.target)
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
    tabsCheckboxes.last = tabsCheckboxes.CBs.indexOf(e.target.id);
  } else {
    checkedByScript = true;
    let pressedCbIdx = tabsCheckboxes.CBs.indexOf(e.target.id)
    let diff = pressedCbIdx - tabsCheckboxes.last
    let sign = diff > 0 ? 1 : -1

    //iterate forward or backward from last pressed checkbox to e.target pressed checkbox
    for (let i = tabsCheckboxes.last; diff > 0 ? i <= pressedCbIdx : i >= pressedCbIdx; i += sign) {
      let current = document.getElementById(tabsCheckboxes.CBs[i])
      if (current.checked !== e.target.checked)
        current.checked = e.target.checked
    }

    checkedByScript = false;
    tabsCheckboxes.last = tabsCheckboxes.CBs.indexOf(e.target.id);
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

  //console.log('on load window', id)
  api.get(`window?${CHROMEID_NAME}=${id}`)
    .then(res => {
      //console.log('window get: ', res.data)

      chrome.windows.create({ focused: true }, w => {
        //console.log('window get: ', res.data)
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
  let tabIds = tabsCheckboxes.selectedIds().map(id => parseInt(StringBuilder.getWindowOrTabIdFromId(id)))
  if (!tabIds || tabIds.length === 0) {
    Exceptions.exceptionNoTabsSelected('No tabs selected')
    return
  }

  api.post('tabsByIds', tabIds)
    .then(res => {
      res.data.forEach(tab => {
        chrome.tabs.create(Helpers.getChromeTabFromBDTab(tab), x => console.log("Tab loaded: ", x))
      })
    })
    .catch(err => {
      Exceptions.databaseError('Error trying to get tabs by ids: ', err)
    })
}
const onLoadSelectedNew = () => {
  let tabIds = tabsCheckboxes.selectedIds().map(id => parseInt(StringBuilder.getWindowOrTabIdFromId(id)))
  if (!tabIds || tabIds.length === 0) {
    Exceptions.exceptionNoTabsSelected('No tabs selected')
    return
  }

  api.post('tabsByIds', tabIds)
    .then(res => {
      //console.log(res.data)
      chrome.windows.create({ focused: true }, w => {
        res.data.forEach(tab => {
          chrome.tabs.create(Helpers.getChromeTabFromBDTab(tab, w.id), x => console.log("Tab loaded: ", x))
        })
      })
    })
    .catch(err => {
      Exceptions.databaseError('Error trying to get tabs by ids: ', err)
    })
}
const onRemoveWindow = () => {
  let id = Helpers.getSelectedWindowId()
  if (!id) {
    Exceptions.exceptionNoWindowSelected()
    return
  }

  api.delete(`window?${CHROMEID_NAME}=${id}`)
    .then(res => {
      let myWindow = { [CHROMEID_NAME]: id }
      let section = document.getElementById(WINDOWS_ID_SECTION)
      section.removeChild(document.getElementById(StringBuilder.buildWindowHeaderButtonId(myWindow)))
      section.removeChild(document.getElementById(StringBuilder.buildWindowBodyParentId(myWindow)))
    })
    .catch(err => { Exceptions.databaseError('Error trying to remove window: ', err) })
}
const onRemoveSelected = () => {
  let tabIds = tabsCheckboxes.selectedIds().map(id => parseInt(StringBuilder.getWindowOrTabIdFromId(id)))
  console.log('tabIds: ', tabIds)
  if (!tabIds || tabIds.length === 0) {
    Exceptions.exceptionNoTabsSelected('No tabs selected')
    return
  }

  api.delete('tabsByIds', {data: tabIds})
    .then(res =>  {
      let body = document.querySelector('.accordion-body')
      tabIds.forEach(id => {
        let elem = document.getElementById(id)
        body.removeChild(document.getElementById(id))
      })
    })
    .catch(err => { Exceptions.databaseError('Error trying to delete selected tabs: ', err) })
}
const onFilterKeyUp = e => {
  let input = e.target.value;
  console.log(input);

  //console.log(Array.from(document.querySelectorAll(`.${TABS_DIV_CLASS}`)))
  Array.from(document.querySelectorAll(`.${TABS_DIV_CLASS}`)).forEach(tabDiv => {
    let children = Array.from(tabDiv.children)
    console.log(children)
    let link = children.filter(elem => elem.tagName === 'A')[0]
    console.log(link.innerText)
    let span = children.filter(elem => elem.tagName === 'SPAN')[0]

    if(!link.href.toLowerCase().includes(input) && 
       !link.innerText.toLowerCase().includes(input) &&
       !span.innerText.toLowerCase().includes(input)) {
      tabDiv.classList.add('collapse')
    } else {
      tabDiv.classList.remove('collapse')
    }
  })  
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
  let windowsSection = document.getElementById(WINDOWS_ID_SECTION)
  windowsSection.innerHTML = ''
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