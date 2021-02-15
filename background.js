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
            onclick: async (info, tab) => select(await GetTabs[id](tab)),
        });
    }
}

function select(tabs) {
    if (!tabs?.length) return;
    const tabIndexes = activeTabFirst(tabs).map(tab => tab.index);
    browser.tabs.highlight({ tabs: tabIndexes, populate: false });
}

// tabs.highlight() focuses (activates) the first tab, so if there's a active tab in the array it should be moved to the start.
function activeTabFirst(tabs) {
    const activeTabIndex = tabs.findIndex(tab => tab.active);
    if (activeTabIndex > 0) {
        [tabs[0], tabs[activeTabIndex]] = [tabs[activeTabIndex], tabs[0]]; // Swap with first
    }
    return tabs;
}
