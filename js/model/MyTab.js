export class MyTab {
  constructor(chromeTab) {
    console.log(chromeTab)
    this.url = chromeTab.url;
    this.tabId = chromeTab.id;
    this.muted = chromeTab.mutedInfo.muted || false;
    this.pinned = chromeTab.pinned;
    this.selected = chromeTab.selected;
    this.title = chromeTab.title;
  }
  equalsChromeTabByUrl(chromeTab) {
    return chromeTab.url === this.url;
  }
  equalsChromeTabById(chromeTab) {
    return chromeTab.id === this.tabId;
  }
}