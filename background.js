import * as GetTabs from './gettabs.js';

init();

function init() {
    const MENU = {
        // function/menuItemId  title
        parent:                 '&Parent Tab',
        parent__descendants:    'P&arent Tab and Descendants',
        target__descendants:    '&This Tab and Descendants',
        descendants:            '&Descendants',
        sameHost:               'Sa&me Domain Tabs',
        sameHost__descendants:  'Sam&e Domain Tabs and Descendants',
    };
    const contexts = ['tab'];

    for (const [id, title] of Object.entries(MENU)) {
        browser.contextMenus.create({
            contexts,
            id,
            title,
            onclick: (_, tab) => select(GetTabs[id], tab),
        });
    }
}

async function select(getter, targetTab) {
    const tabs = await getter(targetTab);
    if (!tabs?.length) return;
    const tabIndexes = activeTabFirst(tabs, targetTab).map(tab => tab.index);
    browser.tabs.highlight({ tabs: tabIndexes, populate: false });
}

// Move an already active tab or the targeted tab, if either is available, to the start of the tabs array.
// Sets up array for tabs.highlight(), which activates the first tab in array.
function activeTabFirst(tabs, targetTab) {
    let activeTabIndex = tabs.findIndex(tab => tab.active);
    if (activeTabIndex === -1) {
        const { id } = targetTab;
        activeTabIndex = tabs.findIndex(tab => tab.id === id);
    }
    if (activeTabIndex > 0) {
        [ tabs[0], tabs[activeTabIndex] ] = [ tabs[activeTabIndex], tabs[0] ];
    }
    return tabs;
}
