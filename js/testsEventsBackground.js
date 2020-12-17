chrome.windows.onRemoved.addListener(windowId => {
  console.log("WINDOW REMOVED", windowId)
});
chrome.windows.onCreated.addListener(window => {
  console.log("WINDOW CREATED", window)
})

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  console.log("TAB REMOVED", removeInfo)
})
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  console.log("TAB UPDATED", changeInfo, tab)
})
chrome.tabs.onCreated.addListener(tab => {
  console.log("TAB CREATED")
})

chrome.tabs.onAttached.addListener((tabId, attachInfo) => {
  console.log("TAB ATTACHED", attachInfo)
})
chrome.tabs.onDetached.addListener((tabId, detachInfo) => {
  console.log("TAB DETACHED", detachInfo)
})