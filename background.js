'use strict';

init();

function init() {
    const MENU = {
        // FunctionName/MenuItemId      Title
        getParentTab:                   '&Parent',
        getParentAndDescendantTabs:     'P&arent and Descendants',
        getSiblingAndDescendantTabs:    '&Siblings and Descendants',
        getTargetAndDescendantTabs:     '&Tab and Descendants',
        getDescendantTabs:              '&Descendants',
        getSiteTabs:                    'Sam&e Site Tabs',
        getSiteAndDescendantTabs:       'Sa&me Site Tabs and Descendants',
    };
    const contexts = ['tab'];

    for (const id in MENU) {
        const getTabs = window[id];
        browser.contextMenus.create({
            contexts,
            id,
            title: MENU[id],
            onclick: async (info, tab) => select(await getTabs(tab)),
        });
    }
}

function select(tabs) {
    if (!tabs?.length) return;
    const tabIndexes = tabsWithFocusedTabFirst(tabs).map(tab => tab.index);
    browser.tabs.highlight({ tabs: tabIndexes, populate: false });
}

// tabs.highlight() focuses (activates) the first tab, so if there's a focused tab in the array it should be moved to the start.
function tabsWithFocusedTabFirst(tabs) {
    const focusedTabIndex = tabs.findIndex(tab => tab.active);
    if (focusedTabIndex > 0) { // If focused tab is in selection and not first
        [tabs[0], tabs[focusedTabIndex]] = [tabs[focusedTabIndex], tabs[0]]; // Swap with first
    }
    return tabs;
}

async function getParentTab(tab) {
    const openerTabId = tab.openerTabId;
    if (openerTabId) return [await browser.tabs.get(openerTabId)];
}

async function getParentAndDescendantTabs(tab) {
    const openerTabId = tab.openerTabId;
    if (openerTabId) {
        const tabPromises = [browser.tabs.get(openerTabId), getDescendantTabs(openerTabId)];
        return (await Promise.all(tabPromises)).flat();
    } else {
        return getTargetAndDescendantTabs(tab);
    }
}

async function getSiblingAndDescendantTabs(tab) {
    return await getDescendantTabs(tab.openerTabId); // Selects all tabs if no parent
}

async function getTargetAndDescendantTabs(tab) {
    return [tab, ...await getDescendantTabs(tab)];
}

async function getDescendantTabs(tab_or_tabId) {
    const tabId = tab_or_tabId?.id || tab_or_tabId;
    const descendantTabs = await browser.tabs.query({ currentWindow: true, openerTabId: tabId });
    for (const tab of [...descendantTabs]) {
        descendantTabs.push(...await getDescendantTabs(tab));
    }
    return descendantTabs;
}

async function getSiteTabs(tab) {
    const host = (new URL(tab.url)).hostname;
    if (host) return await browser.tabs.query({ currentWindow: true, url: `*://${host}/*` });
}

async function getSiteAndDescendantTabs(tab) {
    const siteTabs = await getSiteTabs(tab);
    if (!siteTabs) return;
    for (const tab of [...siteTabs]) {
        siteTabs.push(...await getDescendantTabs(tab));
    }
    return siteTabs;
}
