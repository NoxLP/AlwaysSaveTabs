import * as QueryBuilder from "./model/QueryBuilder.js";

//const axios = require('axios').default;
const api = axios.create({
  baseURL: "http://localhost:3000/",
  timeout: 4000
})
const HTML_NAME = 'tabsManagement.html', CHROMEID_NAME = 'currentChromeId', TABID_NAME = 'tabId'
var mtCreated = null, dragging = false, draggingTimer = null, startOk = true

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
const buildErrorMessage = err => {
  return `${err.response.data}\n${err}`
}
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
    waitForCreatedTab = true
    const newTab = QueryBuilder.getObjectFromTab(tab)

    if (!mtCreated && tabIsMT(tab))
      mtCreated = newTab

    api.post(`tab?${CHROMEID_NAME}=${tab.windowId}`, newTab)
      .then(res => {
        console.log(`Tab created succesfully in BD with response:\n${res}`)
        waitForCreatedTab = false
      })
      .catch(err => {
        console.error(`Error creating tab in BD:\n${buildErrorMessage(err)}`)
        waitForCreatedTab = false
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
        console.error(`Error removing tab in BD:\n${buildErrorMessage(err)}`)
      })
  })

  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    console.log('tab updated', tab, changeInfo)
  
    const relevantProps = ['mutedInfo', 'pinned', 'title', 'url']
    let updatesObject = {}
    let relevantUpdates = Object.keys(changeInfo).filter(x => relevantProps.includes(x))
    
    if(relevantUpdates.length === 0)
      return;

    for(let update of relevantUpdates) {
      if(update === 'mutedInfo')
        updatesObject[muted] = changeInfo.mutedInfo.muted

      updatesObject[update] = changeInfo[update]
    }

    api.patch(`tab?${CHROMEID_NAME}=${tab.windowId}`, QueryBuilder.bodyPatchTabFromWindow(tabId, updatesObject))
      .then(res => {
        console.log(`Tab updated succesfully in BD with response:\n${res}`)
      })
      .catch(err => {
        console.error(`Error updating tab in BD:\n${buildErrorMessage(err)}`)
      })
  })

  chrome.tabs.onAttached.addListener((tabId, attachInfo) => {
    console.log('tab attached')

    chrome.tabs.get(tabId, tab => {
      api.post(`tab?${CHROMEID_NAME}=${attachInfo.newWindowId}`, QueryBuilder.getObjectFromTab(tab))
        .then(res => {
          console.log(`Attahed tab created succesfully in BD with response:\n${res}`)
        })
        .catch(err => {
          console.error(`Error creating attached tab in BD:\n${buildErrorMessage(err)}`)
        })
    })
  })

  chrome.tabs.onDetached.addListener((tabId, detachInfo) => {
    console.log('tab detached')

    api.delete(`tab?${CHROMEID_NAME}=${detachInfo.oldWindowId}&${TABID_NAME}=${tabId}`)
      .then(res => {
        console.log(`Detached tab removed succesfully in BD with response:\n${res}`)
      })
      .catch(err => {
        console.error(`Error removing detached tab in BD:\n${buildErrorMessage(err)}`)
      })

    dragging = true;
    draggingTimer = setTimeout(() => { dragging = false }, 5000);
  })

  chrome.windows.onCreated.addListener(window => {
    console.log('window created ', window)

    chrome.tabs.query({windowId: window.id}, tabs => {
      api.post('window', QueryBuilder.getObjectFromWindow(tabs))
        .then(res => {
          console.log(`Window created succesfully in BD with response:\n${res}`)
        })
        .catch(err => {
          console.error(`Error creating window in BD:\n${buildErrorMessage(err)}`)
        })
    })
  })

  chrome.windows.onRemoved.addListener(windowId => {
    console.log('window removed')

    if(dragging) {
      api.delete(`window?${CHROMEID_NAME}=${windowId}`)
        .then(res => {
          console.log(`Window removed succesfully in BD with response:\n${res}`)
        })
        .catch(err => {
          console.error(`Error removing window in BD:\n${buildErrorMessage(err)}`)
        })
      
      clearTimeout(draggingTimer)
      dragging = false
    }
  })
}

chrome.tabs.query({}, async (tabs) => {
  console.log('initial query ', QueryBuilder.bodyGetWindowByUrls(tabs))
  let bdWindow;
  try {
    bdWindow = (await api.post('windowByURLs', { body: QueryBuilder.bodyGetWindowByUrls(tabs) 
    }
    )).data
  } catch(err) {
    if(err.response.data === 'No window found with the given parameters') {
      console.warn('No window found with the given parameters, creating initial new window')

      api.post('window', QueryBuilder.getObjectFromWindow(tabs))
        .then(res => {
          console.log(`Window created succesfully in BD with response:\n${res}`)
          startOk = true
        })
        .catch(err => {
          startOk = false
          console.error(`Error creating window in BD:\n${buildErrorMessage(err)}`)
        })
    } else {
      startOk = false
      console.error(`Error getting window by urls:\n${buildErrorMessage(err)}`)
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
      startOk = true
    })
    .catch(err => {
      startOk = false
      console.error(`Error starting window's ids update:\n${JSON.stringify(buildErrorMessage(err))}`)
    })
})