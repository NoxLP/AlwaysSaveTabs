import { MyTab } from "./model/MyTab.js";
import { MyWindow } from "./model/MyWindow.js";

console.log("*/******************** MANAGEMENT")
const TAB_PARENT_DIV_ID_PREFIX = "tabDiv",
  TAB_PARENT_HR_ID_PREFIX = "tabHr",
  TABS_STORAGE_KEY = "tabsWhenClosing",
  MT_WINDOWSLIST = "windowsList",
  REMOVE_TAB_CB_CLASS = "deleteTabCB",
  LOAD_TAB_CB_CLASS = "loadTabCB";
const CHECKED_CHECKBOXES = {
  CBs: [],
  last: 0,
  selectedIds: function () { return CHECKED_CHECKBOXES.CBs.filter(x => document.getElementById(x).checked) }
};
var shift = false, checkedByScript = false, filterCaseSensitive = false;

//#region helpers
const saveOnLocalStorage = () => {
  localStorage.setItem(TABS_STORAGE_KEY, JSON.stringify(myWindows));
}
const buildTabDivId = id => { return TAB_PARENT_DIV_ID_PREFIX + id; }
const buildTabHrId = id => { return TAB_PARENT_HR_ID_PREFIX + id; }
const getHrIdFromDivId = id => { return buildTabHrId(id.match(new RegExp(`(?<=${TAB_PARENT_DIV_ID_PREFIX}).*`))[0]) }
const storeCheckbox = cb => {
  CHECKED_CHECKBOXES.CBs.push(cb.getAttribute("id"));
  cb.addEventListener("change", onTabCBChange);
};
const createTabElementIn = (element, tab) => {
  console.log("createTabElementIn", tab)
  let tabElem = document.createElement("div");
  tabElem.title = tab.title + "   ;   " + tab.url;
  tabElem.id = buildTabDivId(tab.tabId);
  let domain = tab.url.match(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n\?\=]+)/im)[0];
  let icon = "http://s2.googleusercontent.com/s2/favicons?domain_url=" + domain;
  console.log("ICON URL-------", icon)
  tabElem.innerHTML = `
    <input class="${REMOVE_TAB_CB_CLASS}" type="checkbox" id="${tab.tabId}">
    <img src="${icon}" alt="web icon">
    <a target="_blank" href="${tab.url}">
      <div>${tab.title}</div>
      <div>${domain}</div>
    </a>
    <br>`;
  element.appendChild(tabElem);

  let hr = document.createElement("hr");
  hr.id = buildTabHrId(tab.id);

  element.appendChild(hr);

  storeCheckbox(tabElem.getElementsByClassName(REMOVE_TAB_CB_CLASS)[0]);
};
//#endregion

//#region events callbacks
/*const onSaveCurrentWindowTabs = () => {
  console.log("onSaveCurrentWindowTabs")
  chrome.tabs.query({}, function (tabs) {
    console.log("QUERY", tabs)
    let windowsStored = localStorage.getItem(TABS_STORAGE_KEY);
    let windows = windowsStored[TABS_STORAGE_KEY];
    if (!windows || windows.length === 0) {

      localStorage.setItem({
        TABS_STORAGE_KEY,
        [TABS_STORAGE_KEY]: [
          new MyWindow(tabs[0].windowId, tabs)
        ]
      });
    } else {
      let myWindow = new MyWindow(tabs[0].windowId, tabs);
      if (!windows.some(x => x.allTabsEqualsByUrl(myWindow.tabs))) {
        windows.push(myWindow);
        localStorage.setItem(TABS_STORAGE_KEY, { [TABS_STORAGE_KEY]: windows });
      }
    }
    /*chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
      chrome.tabs.reload(tabs[0].id);
    });*/
    /*buildHtml();
  });
};*/
const onLoadAllTabs = () => {
  let windowsStored = localStorage.getItem(TABS_STORAGE_KEY);
  for (let windowKey in windowsStored[TABS_STORAGE_KEY]) {
    windowsStored[TABS_STORAGE_KEY][windowKey].tabs
      .forEach(tab => {
        chrome.tabs.create({ url: tab.url }, x => console.log("Tab loaded:", x))
      });
  }
};
const onLoadSelectedTabs = () => {
  const selectedIds = CHECKED_CHECKBOXES.selectedIds();
  let windowsStored = localStorage.getItem(TABS_STORAGE_KEY);
  for (let windowKey in windowsStored[TABS_STORAGE_KEY]) {
    windowsStored[TABS_STORAGE_KEY][windowKey].tabs
      .filter(tab => selectedIds.includes(tab.tabId))
      .forEach(tab => {
        chrome.tabs.create({ url: tab.url }, x => console.log("Tab loaded:", x))
      });
  }
};
const onRemoveSelectedTabs = () => {
  const selectedIds = CHECKED_CHECKBOXES.selectedIds();
  var removedIds = [];
  selectedIds.forEach(id => {
    let tabDiv = document.getElementById(`${TAB_PARENT_DIV_ID_PREFIX}${id}`);
    let parent = tabDiv.closest(`.window`);
    parent.removeChild(tabDiv);
    parent.removeChild(document.getElementById(`${TAB_PARENT_HR_ID_PREFIX}${id}`));
    removedIds.push(id);
  });

  console.log(removedIds)
  let windowsStored = localStorage.getItem(TABS_STORAGE_KEY);
  var tmpTabs = {};
  for (let windowKey in windowsStored[TABS_STORAGE_KEY]) {
    tmpTabs[windowKey] = windowsStored[TABS_STORAGE_KEY][windowKey].filter(tab => !removedIds.includes(tab.id.toString()));
  }
  console.log(tmpTabs)
  localStorage.setItem(TABS_STORAGE_KEY, JSON.stringify(tmpTabs));
}
const onTabCBChange = e => {
  if (checkedByScript)
    return;

  if (!shift) {
    CHECKED_CHECKBOXES.last = CHECKED_CHECKBOXES.CBs.indexOf(e.target.getAttribute("id"));
  } else {
    checkedByScript = true;
    const forward = CHECKED_CHECKBOXES.CBs.indexOf(e.target.id) > CHECKED_CHECKBOXES.last;
    var i = CHECKED_CHECKBOXES.last + 1 * (forward ? 1 : -1), current;
    while (i < CHECKED_CHECKBOXES.CBs.length &&
      (current = CHECKED_CHECKBOXES.CBs[i]) !== e.target.id) {
      document.getElementById(current).checked = e.target.checked;
      i = i + 1 * (forward ? 1 : -1);
    }
    if (!forward) {
      let last = document.getElementById(CHECKED_CHECKBOXES.CBs[CHECKED_CHECKBOXES.last]);
      last.checked = !last.checked;
    }

    checkedByScript = false;
    CHECKED_CHECKBOXES.last = CHECKED_CHECKBOXES.CBs.indexOf(e.target.getAttribute("id"));
  }
};
const onScrollStickyTop = () => {
  const sticky = document.getElementsByTagName("aside")[0];
  console.log(sticky.style.top);
  if (window.pageYOffset > parseInt(sticky.style.top)) {
    sticky.classList.add("stickyTop");
  } else {
    sticky.classList.remove("stickyTop");
  }
};
const onFilterHoverFocus = e => {
  if (document.activeElement === document.getElementById("filterInput"))
    return;

  document.querySelectorAll(".filter").forEach(x => {
    if (e.type === "mouseout" || e.type === "focusout")
      x.classList.remove("filterHoverFocus")
    else
      x.classList.add("filterHoverFocus")
  });
}
const onFilterKeyUp = e => {
  let input = e.target.value;
  console.log(input);

  Array.from(document.querySelectorAll(".window > div"))
    .filter(x => window.getComputedStyle(x).visibility !== "hidden")
    .forEach(x => {
      var link = x.getElementsByTagName("a")[0], reg = new RegExp(input, "i");
      console.log(link.getAttribute("href"))
      if (reg.test(link.getAttribute("href")) ||
        Array.from(link.getElementsByTagName("div")).some(x => reg.test(x.innerText))) {
        x.style.display = "flex";//.classList.remove("hidden");
        document.getElementById(getHrIdFromDivId(x.id)).style.display = "block";//.classList.remove("hidden");
      } else {
        x.style.display = "none";//.classList.add("hidden");
        document.getElementById(getHrIdFromDivId(x.id)).style.display = "none";//.classList.add("hidden");
      }
    });
};
//#endregion

//#region events
document.addEventListener("keydown", e => {
  if (e.key === "Shift") {
    shift = true;
  }
});
document.addEventListener("keyup", e => {
  if (e.key === "Shift") {
    shift = false;
  }
});
window.onload = () => {
  //document.getElementById("saveAll").addEventListener("click", onSaveCurrentWindowTabs);
  document.getElementById("loadAll").addEventListener("click", onLoadAllTabs);
  document.getElementById("loadSel").addEventListener("click", onLoadSelectedTabs);
  document.getElementById("remSel").addEventListener("click", onRemoveSelectedTabs);
  document.querySelectorAll(".filter").forEach(x => {
    x.addEventListener("mouseover", onFilterHoverFocus);
    x.addEventListener("mouseout", onFilterHoverFocus);
  });
  let filterInput = document.getElementById("filterInput");
  filterInput.addEventListener("focus", onFilterHoverFocus);
  filterInput.addEventListener("focusout", onFilterHoverFocus);
  filterInput.addEventListener("keyup", onFilterKeyUp);
};
window.onscroll = onScrollStickyTop;
//#endregion

(function buildHtml() {
  let windowsStored = JSON.parse(localStorage.getItem(TABS_STORAGE_KEY));
  console.log("*/******************** STORAGE GET")
  console.log(windowsStored)
  let wList = document.getElementById(MT_WINDOWSLIST);

  for (let windowKey in windowsStored[TABS_STORAGE_KEY]) {
    let window = windowsStored[TABS_STORAGE_KEY][windowKey];
    console.log(window)
    let windowElem = document.createElement("div");
    windowElem.classList.add("window");

    window.tabs.forEach(tab => createTabElementIn(windowElem, tab));
    wList.appendChild(windowElem);
    wList.appendChild(document.createElement("br"));
  }
})();