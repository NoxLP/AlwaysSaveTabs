import { MyTab } from "./MyTab.js";


export class MyWindow {
  /**
   * Constructor
   * @param {chromeId} windowId Original chrome window id
   * @param {array} tabs Array of new tabs
   * @param {string} from Creating new window from JSON(local storage) "JSON", new window opened by user "user", or using a myTab object(usually from attach-detach) "myTab"
   */
  constructor(windowId, tabs, from = "user") {
    this.tabs = from === "user" ? 
      tabs.map(tab => new MyTab(tab)) : 
      from === "JSON" ? tabs.map(tab => MyTab.mapFromJSON(tab)) :
      tabs;
    this.currentChromeId = windowId;
  }
  static mapFromJSON(parsedJSON) {
    return new MyWindow(parsedJSON.currentChromeId, parsedJSON.tabs, "JSON");
  }
  /**
   * Returns if tabs array have the same tabs than this.tabs. Used to check if new opened window's tabs are the same as a stored MyWindow's tabs array.
   * @param {array} tabs Array of chrome tabs provided by chrome on getAllWindow event
   */
  allTabsEqualsByUrl(tabs) {
    //Obviously, if length is different they're not equal
    if (this.tabs.length !== tabs.length) return false;

    //sort copies of both arrays
    let thisTabs = [...this.tabs];
    thisTabs.sort((a, b) => a.url.localeCompare(b.url));
    let otherTabs = [...tabs];
    otherTabs.sort((a, b) => a.url.localeCompare(b.url));

    //with both arrays sorted, if someone is different arrays are not equal
    for (let i = 0; i < thisTabs.length; i++) {
      if (thisTabs[i].equalsChromeTabByUrl(otherTabs[i]))
        return false;
    }
    return true;
  }
  /**
   * Find and return tab's correspondent MyTab on this.tabs if it exists, else return false.
   * @param {chromeTab} tab Tab ro be found on this.tabs
   */
  findMyTabOf(tab) {
    let index = this.tabs.findIndex(x => x.equalsChromeTabByUrl(tab));
    if (index !== -1)
      return this.tabs[index];
    return false;
  }
  /**
   * Find and return MyTab index with tabId on this.tabs if it exists, else return false.
   * @param {chromeTab} tab Tab ro be found on this.tabs
   */
  findMyTabIndexByChromeId(tabId) {
    return this.tabs.findIndex(x => x.tabId === tabId);
  }
  /**
   * Update tabId of all MyTab in this.tabs. Does NOT check if tabs has same tabs as this.tabs.
   * @param {array} tabs Array of chrome tabs, usually provided through getAllInWindow event's parameter
   */
  updateTabsChromeIds(tabs) {
    tabs.forEach(x => {
      let tab = this.findMyTabOf(x);
      tab.tabId = x.id;
    });
  }
}