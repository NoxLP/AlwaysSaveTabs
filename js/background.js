import { QueryBuilder } from "./model/QueryBuilder";

chrome.tabs.onCreated.addListener(tab => {

})

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {

})

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {

})

chrome.tabs.onAttached.addListener((tabId, attachInfo) => {

})

chrome.tabs.onDetached.addListener((tabId, detachInfo) => {

})

chrome.windows.onRemoved.addListener(windowId => {

})

chrome.windows.onCreated.addListener(window => {
  
})

chrome.tabs.query({}, tabs => {

})