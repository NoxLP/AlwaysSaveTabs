import { MyTab } from "./model/MyTab.js";
import { MyWindow } from "./model/MyWindow.js";

const TABS_STORAGE_KEY = "tabsWhenClosing", HTML_NAME = "tabsManagement.html";
const MSG_CONFIRM_MULTIPLE_WINDOWS = `Hay pestañas guardadas para varias ventanas. Se cargarán las
pestañas de la ventana con más pestañas. Si prefiere elegir otras pestañas debe hacerlo desde 
gestión de pestañas. ¿Quiere abrir gestión de pestañas?`;
const MSG_CONFIRM_STORE_CLOSING_WINDOW_TABS = `Acaba de cerrar una ventana de chrome ¿Quiere guardar las pestañas?`;

//chrome.storage.local.set({ [TABS_STORAGE_KEY]: null });
//loaded windows from chrome local storage
var loadedWindows = [];
//windows currently on screen
var windows = [];
//is management tab already created?
var mtCreated;

//**************************************************************************
// UI
//#region ui
/**
 * Open new tab
 * @param {string} url Tab url
 */
const openInNewTabOrSelectExistingTab = url => {
  console.log()
  console.log("%%%%%%%% NEW TAB")
  chrome.tabs.query({}, function (tabs) { console.log(tabs) });
  if (!mtCreated) {
    chrome.tabs.create({ "url": url });
    mtCreated = true;
  } else {
    //********************** TODO  
    //Select tab with url === url among existing tabs

    for (let windowKey in windows) {
      let index = windows[windowKey].tabs.findIndex(x => x.url === url);
      if (index != -1) {
        chrome.tabs.update(windows[index].tabId, { selected: true });
        break;
      }
    }
  }
};
/**
 * Check if tab is management tab
 * @param {chromeTab} tab Tab to check
 */
const tabIsMT = tab => {
  console.log("ISMT ", tab)
  return tab.url.slice(tab.url.length - HTML_NAME.length) === HTML_NAME;
}

/**
 * Event for opening extension management tab
 */
chrome.browserAction.onClicked.addListener(() => {
  console.log("ICON CLICK")
  openInNewTabOrSelectExistingTab("./" + HTML_NAME);
});
//#endregion

//**************************************************************************
// TABS MANAGING
/*
Store every new window
  if tabs equals one of the stored windows
    update window currentChromeId
    store saved window as open window
  else
    create new MyWindow
Store every new tab in respective window
Update every tab url in respective window
Remove tab of its respective window unless the window is closing
When a window is removed, ask user if store permanently its tabs
*/

/**
 * Save all tabs to local storage. Return index of current window so it can be removed in case the function was called by the remove window event.
 */
const saveAll = () => {
  if (windows.length === 1) { //window closing is the only one opened => update local storage
    chrome.storage.local.set({ [TABS_STORAGE_KEY]: windows });
    return 0;
  } else { //otherwise ask if user want to store closing window
    let index = windows.findIndex(x => x.currentChromeId === windowId);
    if (window.confirm(MSG_CONFIRM_STORE_CLOSING_WINDOW_TABS)) {
      loadedWindows.push(windows[index]);
      chrome.storage.local.set({ [TABS_STORAGE_KEY]: loadedWindows });
    }
    return index;
  }
}

/**
 * Used when a new window is opened to add correspondent MyWindow to windows or to update existing MyWindow
 * @param {array} tabs Tabs of new window that chrome provides through getAllInWindow event's parameter
 */
const addOrUpdateNewWindow = tabs => {
  console.log("Loaded windows ", loadedWindows)
  let newWindow;
  if(loadedWindows.length === 0) {
    //add opened window to loaded windows
    newWindow = new MyWindow(tabs[0].windowId, tabs);
    loadedWindows.push(newWindow)
  } else {
    loadedWindows = loadedWindows.map(x => MyWindow.mapFromJSON(x));
    let loadedWindowIndex = loadedWindows.findIndex(x => x.allTabsEqualsByUrl(tabs));
    if (loadedWindowIndex === -1) { //if no loaded window equals opened window
      //add opened window to loaded windows
      newWindow = new MyWindow(tabs[0].windowId, tabs);
      loadedWindows.push(newWindow)
    } else { //found a window already loaded with same tabs
      newWindow = loadedWindows[loadedWindowIndex];
      //update window id
      newWindow.currentChromeId = tabs[0].windowId;
      //update loaded tabs current and chrome tabId
      newWindow.updateTabsChromeIds(tabs);
    }
  }
  //anyway, add new window to windows
  windows.push(newWindow);
  console.log("loadedWindows", loadedWindows)
  console.log("windows", windows)
  saveAll();
}

/*
Store every new window
  if tabs equals one of the stored windows
    update window currentChromeId
    store saved window as open window
  else
    create new MyWindow
*/
chrome.tabs.getAllInWindow(null, tabs => {
  //if there are no windows loaded yet(first window opened), load stored windows
  if (loadedWindows.length === 0) {
    chrome.storage.local.get(TABS_STORAGE_KEY, windowsStored => {
      console.log("windowsStored", windowsStored[TABS_STORAGE_KEY])
      loadedWindows = windowsStored[TABS_STORAGE_KEY] || [];
      addOrUpdateNewWindow(tabs);
    });
  } else {
    console.log("length != 0")
    addOrUpdateNewWindow(tabs);
  }
});

//Store every new tab in respective window
chrome.tabs.onCreated.addListener(tab => {
  /*
  found tab's MyWindow on windows
  add tab to window
  */
  console.log("----------- on created")
  let index = windows.findIndex(x => x.currentChromeId === tab.windowId);
  if (index === -1)
    windows.push(new MyWindow(tab.windowId, [tab]));
  else
    windows[index].tabs.push(new MyTab(tab));

  saveAll();
});

//Update every tab url in respective window
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  /*
  if changes on tab are different than url, stop
  else find tab's MyTab and update url
  */
  console.log("----------- on updated")
  if (!changeInfo.hasOwnProperty("url"))
    return;

  console.log(tab)
  console.log(changeInfo.url)
  let myTab;
  for (let i = 0; i < windows.length; i++) {
    let window = windows[i];
    if (window.currentChromeId === tab.windowId) {
      myTab = window.tabs[window.findMyTabIndexByChromeId(tabId)];
      break;
    }
  }
  myTab.url = tab.url;

  saveAll();
});


//Remove tab of its respective window unless the window is closing
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  console.log("----------- on removed", removeInfo)
  if (removeInfo.isWindowClosing) {
    console.log("CLOSING ");
    return;
  }

  for (let i = 0; i < windows.length; i++) {
    let window = windows[i];
    let index = window.findMyTabIndexByChromeId(tabId);
    if (index === -1)
      continue;
    else {
      if (tabIsMT(window.tabs[index]))
        mtCreated = false;

      window.tabs.splice(index, 1);
      break;
    }
  }

  saveAll();
});

//When a window is removed, ask user if store permanently its tabs
chrome.windows.onRemoved.addListener(windowId => {
  let index = saveAll();
  windows.splice(index, 1);
});