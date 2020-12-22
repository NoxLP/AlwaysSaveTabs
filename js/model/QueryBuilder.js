export const bodyGetWindowByUrls = urlsArray => {
  return {
    $and: [
      {
        tabs: { $size: urlsArray.length }
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