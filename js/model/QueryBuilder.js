export const bodyGetWindowByUrls = tabs => {
  let urlsArray = tabs.map(x => x.url)
  return {
    $and: [
      {
        'tabs': { $size: urlsArray.length }
      },
      {
        'tabs.url': { $all: urlsArray }
      }
    ]
  }
}
export const bodyPatchTabFromWindow = (tabId, updatesObject) => {
  return [ tabId, updatesObject ]
}
export const bodyPatchWindowChromeId = newChromeId => {
  return { currentChromeId: newChromeId }
}
export const bodyPatchUpdateTabsIds = (bdWindow, tabs) => {
  /*
  body = {
    oldTabId: newTabId,
    ...
  }
  */
  let body = {}
  bdWindow.tabs.forEach(tab => {
    let tabIndex;
    if((tabIndex = tabs.findIndex(x => x.url === tab.url)) !== -1) {
      body[tab.tabId] = tabs[tabIndex].id
    }
  })
  return body
}
export const bodyPatchWindowTitle = title => {
  return { 'title': title}
}
export const getObjectFromTab = tab => {
  return {
    url: tab.url,
    tabId: tab.id,
    title: tab.title,
    muted: tab.mutedInfo.muted,
    pinned: tab.pinned,
    selected: tab.selected
  }
}
export const getObjectFromWindow = tabs => {
  return {
    'tabs': tabs.map(x => getObjectFromTab(x)),
    currentChromeId: tabs[0].windowId,
    creationDate: Date.now()
  }
}