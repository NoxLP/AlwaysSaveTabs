const bodyGetWindowByUrls = urlsArray => {
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
const bodyPatchTabFromWindow = (tabId, updatesObject) => {
  return [ tabId, updatesObject ]
}
const bodyPatchWindowChromeId = newChromeId => {
  return { currentChromeId: newChromeId }
}