import * as QueryBuilder from "./model/QueryBuilder.js";

//const axios = require('axios').default;
const api = axios.create({
  baseURL: "http://localhost:3000/",
  timeout: 4000
})
const HTML_NAME = 'tabsManagement.html', CHROMEID_NAME = 'currentChromeId', TABID_NAME = 'tabId'
var mtCreated = null, dragging = false, draggingTimer = null, startOk = false

//#region helpers
/**
 * Check if tab is management tab
 * @param {chromeTab} tab Tab to check
 */
const tabIsMT = tab => {
  console.log("ISMT ", tab)
  return tab.url.slice(tab.url.length - HTML_NAME.length) === HTML_NAME;
}
/**
 * Open new tab
 * @param {string} url Tab url
 */
const openInNewTabOrSelectExistingTab = url => {
  console.log()
  console.log("%%%%%%%% NEW TAB")
  //chrome.tabs.query({}, function (tabs) { console.log(tabs) });
  if (!mtCreated) {
    chrome.tabs.create({ "url": url });
    mtCreated = true;
  } else {
    //*********** TODO **********************/
    //SELECT MANAGEMENT TAB
  }
};
//#endregion

if(startOk) {
  /**
   * Event for opening extension management tab
   */
  chrome.browserAction.onClicked.addListener(() => {
    console.log("ICON CLICK")
    openInNewTabOrSelectExistingTab("./" + HTML_NAME);
  });

  chrome.tabs.onCreated.addListener(tab => {
    console.log('tab created ', tab)
    const newTab = QueryBuilder.getObjectFromTab(tab)

    if (!mtCreated && tabIsMT(tab))
      mtCreated = newTab

    api.post(`tab?${CHROMEID_NAME}=${tab.windowId}`, newTab)
      .then(res => {
        console.log(`Tab created succesfully in BD with response:\n${res}`)
      })
      .catch(err => {
        console.error(`Error creating tab in BD:\n${err}`)
      })
  })

  chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
    console.log('tab removed ', tabId)
    if (mtCreated && mtCreated.tabId === tabId)
      mtCreated = null

    api.delete(`tab?${CHROMEID_NAME}=${removeInfo.windowId}&${TABID_NAME}=${tabId}`)
      .then(res => {
        console.log(`Tab removed succesfully in BD with response:\n${res}`)
      })
      .catch(err => {
        console.error(`Error removing tab in BD:\n${err}`)
      })
  })
  /*
  const tabSchema = new Schema({
    url: {type: String, required: true},
    tabId: {type: String, required: true},
    title: {type: String, required: true},
    muted: {type: Boolean, required: true},
    pinned: {type: Boolean, required: true},
    selected: {type: Boolean, required: true}
  })
  const windowSchema = new Schema({
    tabs: {type: [tabSchema], required: true},
    currentChromeId: {type: String, required: true},
    creationDate: {type: Date, required: true}
  })
  */
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    let updatesObject = {}
    if (changeInfo.mutedInfo)
      updatesObject[muted] = changeInfo.mutedInfo.muted
    if (changeInfo.pinned)
      updatesObject[pinned] = changeInfo.pinned
    if (changeInfo.title)
      updatesObject[title] = changeInfo.title
    if (changeInfo.url)
      updatesObject[url] = changeInfo.url

    api.patch(`tab?${CHROMEID_NAME}=${tab.windowId}`, QueryBuilder.bodyPatchTabFromWindow(tabId, updatesObject))
      .then(res => {
        console.log(`Tab updated succesfully in BD with response:\n${res}`)
      })
      .catch(err => {
        console.error(`Error updating tab in BD:\n${err}`)
      })
  })

  chrome.tabs.onAttached.addListener((tabId, attachInfo) => {
    chrome.tabs.get(tabId, tab => {
      api.post(`tab?${CHROMEID_NAME}=${attachInfo.newWindowId}`, QueryBuilder.getObjectFromTab(tab))
        .then(res => {
          console.log(`Attahed tab created succesfully in BD with response:\n${res}`)
        })
        .catch(err => {
          console.error(`Error creating attached tab in BD:\n${err}`)
        })
    })
  })

  chrome.tabs.onDetached.addListener((tabId, detachInfo) => {
    api.delete(`tab?${CHROMEID_NAME}=${detachInfo.oldWindowId}&${TABID_NAME}=${tabId}`)
      .then(res => {
        console.log(`Detached tab removed succesfully in BD with response:\n${res}`)
      })
      .catch(err => {
        console.error(`Error removing detached tab in BD:\n${err}`)
      })

    dragging = true;
    draggingTimer = setTimeout(() => { dragging = false }, 5000);
  })

  chrome.windows.onCreated.addListener(window => {
    api.post('window', QueryBuilder.getObjectFromWindow(window))
      .then(res => {
        console.log(`Window created succesfully in BD with response:\n${res}`)
      })
      .catch(err => {
        console.error(`Error creating window in BD:\n${err}`)
      })
  })

  chrome.windows.onRemoved.addListener(windowId => {
    if(dragging) {
      api.delete(`window?${CHROMEID_NAME}=${windowId}`)
        .then(res => {
          console.log(`Window removed succesfully in BD with response:\n${res}`)
        })
        .catch(err => {
          console.error(`Error removing window in BD:\n${err}`)
        })
      
      clearTimeout(draggingTimer)
      dragging = false
    }
  })
}

chrome.tabs.query({}, async (tabs) => {
  console.log('initial query')
  let bdWindow;
  try {
    bdWindow = (await api.get('windowByURLs', QueryBuilder.bodyGetWindowByUrls(tabs))).data
  } catch(err) {
    if(err.response.data === 'No window found with the given parameters') {
      console.warn('No window found with the given parameters, creating initial new window')
      chrome.windows.getCurrent({}, current => {
        console.log('current window ', current)
        api.post('window', QueryBuilder.getObjectFromWindow(current, tabs))
          .then(res => {
            console.log(`Window created succesfully in BD with response:\n${res}`)
          })
          .catch(err => {
            startOk = false
            console.error(`Error creating window in BD:\n${err}`)
          })
      })
    } else {
      startOk = false
      console.error(`Error getting window by urls:\n${err}`)
    }

    return;
  }
  console.log('bdWindow ', bdWindow)
  Promise.all([
    api.patch(`windowChromeId?_id=${bdWindow._id}`, QueryBuilder.bodyPatchWindowChromeId(tabs[0].windowId)),
    api.patch(`tabsIds?_id=${bdWindow._id}`, QueryBuilder.bodyPatchUpdateTabsIds(bdWindow, tabs))
  ])
    .then((res1, res2) => {
      console.log(`Done starting window's ids update:\n${res1}\n\n${res2}`)
    })
    .catch(err => {
      startOk = false
      console.error(`Error starting window's ids update:\n${err}`)
    })
})