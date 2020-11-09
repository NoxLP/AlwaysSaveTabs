const TABS_STORAGE_KEY = "tabsWhenClosing", HTML_NAME = "tabsManagement.html", 
    MSG_CONFIRM_MULTIPLE_WINDOWS = `Hay pestañas guardadas para varias ventanas. Se cargarán las
pestañas de la ventana con más pestañas. Si prefiere elegir otras pestañas debe hacerlo desde 
gestión de pestañas. ¿Quiere abrir gestión de pestañas?`;

var myTabs = {}, windowsByTabs = {}, mtCreated;

//**************************************************************************
// UI
const openInNewTabOrSelectExistingTab = url => {
    console.log()
    console.log("%%%%%%%% NEW TAB")
    if(!mtCreated)
        chrome.tabs.create({"url": url});
    else {
        for(let window in myTabs) {
            let index;
            if((index = window.findIndex(tab => tabIsMT(tab))) != -1) {
                chrome.tabs.update(window[index].id, {selected: true});
                break;
            }
        }
    }
};
const tabIsMT = tab => {
    console.log("ISMT ", tab)
    return tab.url.slice(tab.url.length - HTML_NAME.length) === HTML_NAME;
}
chrome.browserAction.onClicked.addListener(() => {
    console.log("ICON CLICK")
    openInNewTabOrSelectExistingTab("./" + HTML_NAME);
});


//**************************************************************************

//**************************************************************************
// TABS MANAGING
const storeTab = (tab, sync = true) => {
    if(!myTabs.hasOwnProperty(tab.windowId))
        myTabs[tab.windowId] = [];
    else if(myTabs[tab.windowId].findIndex(x => x.id === tab.id) !== -1) 
        return;

    myTabs[tab.windowId].push(tab);
    windowsByTabs[tab.id] = tab.windowId;

    if(sync)
        chrome.storage.local.set({[TABS_STORAGE_KEY]: myTabs});
};
const removeTab = tabId => {
    if(!windowsByTabs.hasOwnProperty(tabId))
        return;

    let index, window = windowsByTabs[tabId];
    if(!myTabs.hasOwnProperty(window) || (index = myTabs[window].findIndex(x => x.id === tabId)) === -1)
        return;
    
    if(tabIsMT(myTabs[window][index])) {
        console.log("************ CREATED FALSE")
        mtCreated = false;
    }
    myTabs[window].splice(index, 1);
    if(myTabs[window].length === 0)
        delete myTabs[window];

    chrome.storage.local.set({[TABS_STORAGE_KEY]: myTabs});
};
const updateTab = tab => {
    let index = myTabs[tab.windowId].findIndex(x => x.id === tab.id);
    myTabs[tab.windowId][index] = tab;
    console.log("UPDATED TAB TO", myTabs[tab.windowId][index]);

    chrome.storage.local.set({[TABS_STORAGE_KEY]: myTabs});
}
/*const updateTabPropertyNoCheck = (tab, prop, value) => {
    let index = myTabs[tab.windowId].findIndex(x => x.id === tab.id);
    myTabs[tab.windowId][index][prop] = value;
    console.log("UPDATED TAB ", myTabs[tab.windowId][index] , "PROP: ", prop, "TO: ", myTabs[tab.windowId][index][prop]);

    chrome.storage.local.set({[TABS_STORAGE_KEY]: myTabs});
}*/
const getWindowTabsString = windowId => {
    return myTabs[windowId]
        .map(x => x.url)
        .join("\n");
};

chrome.tabs.getAllInWindow(null, tabs => {
    chrome.storage.local.get(TABS_STORAGE_KEY, tabsStored => {
        console.log("tabsStored", tabsStored)
        let windows = Object.keys(tabsStored);
        console.log("KEYS",tabsStored[TABS_STORAGE_KEY][windows[0]], windows)
        if(windows.length > 1 && window.confirm(MSG_CONFIRM_MULTIPLE_WINDOWS)) {
            openInNewTabOrSelectExistingTab("./" + HTML_NAME);
            return;  
        } else {
            console.log("getAllInWindow------------")
            if(!tabsStored[TABS_STORAGE_KEY][windows[0]] || tabs.length > tabsStored[TABS_STORAGE_KEY][windows[0]].length) {
                tabs.forEach(x => {
                    storeTab(x);
                });
            } else {
                myTabs[windows[0]] = tabsStored[TABS_STORAGE_KEY][windows[0]];
            }
        }
    });
    /*chrome.storage.local.set({[TABS_STORAGE_KEY]: null});
    tabs.forEach(x => {
        storeTab(x, false);
    });
    console.log("myTabs", myTabs)
    chrome.storage.local.set({[TABS_STORAGE_KEY]: myTabs});*/
});

chrome.tabs.onCreated.addListener(tab => {
    console.log("----------- on created");

    storeTab(tab);
    if(tabIsMT(tab) && !mtCreated)
        mtCreated = true;
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    console.log("----------- on updated")
    if(!changeInfo.hasOwnProperty("url"))
        return;

    console.log(tab)
    console.log(changeInfo.url)
    updateTab(tab);
});

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
    console.log("----------- on removed")
    if(removeInfo.isWindowClosing)
        return;
        
    removeTab(tabId);
});

/*chrome.windows.onRemoved.addListener(windowId => {
    console.log("--------- On window removed");
    console.log("MYTABS", myTabs);
    
    //Test icons not being stored when window gets closed
    let tabs = myTabs[Object.keys(myTabs)[0]];
    console.log(tabs.filter(x => x.favIconUrl));
    //*****************************************************

    chrome.storage.local.set({[TABS_STORAGE_KEY]: myTabs});
    chrome.storage.local.get(TABS_STORAGE_KEY, x => console.log("STORED"));
});*/
//**************************************************************************