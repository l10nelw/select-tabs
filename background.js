'use strict';

const menu = {
    // Menu item id/Function name   // Title
    selectParent:                   '&Parent',
    selectParentAndDescendants:     'P&arent and Descendants',
    selectSiblingsAndDescendants:   '&Siblings and Descendants',
    selectTargetAndDescendants:     '&Tab and Descendants',
    selectDescendants:              '&Descendants',
    selectSite:                     'Sa&me Site Tabs',
    selectSiteAndDescendants:       'Sam&e Site Tabs and Descendants',
}

for (const id in menu) {
    browser.contextMenus.create({
        id,
        title: menu[id],
        onclick: window[id],
        contexts: ['tab'],
    });
}

function selectParent(_, tab) {
    const parentTabId = tab.openerTabId;
    if (parentTabId) {
        browser.tabs.update(parentTabId, { active: true });
    }
}

async function selectParentAndDescendants(_, tab) {
    const parentTabId = tab.openerTabId;
    if (parentTabId) {
        const tabPromises = [browser.tabs.get(parentTabId), getDescendants(parentTabId)];
        const familyTabs = (await Promise.all(tabPromises)).flat();
        select(familyTabs);
    } else {
        selectTargetAndDescendants(_, tab);
    }
}

async function selectSiblingsAndDescendants(_, tab) {
    const familyTabs = await getDescendants(tab.openerTabId);
    select(familyTabs);
}

async function selectTargetAndDescendants(_, tab) {
    const familyTabs = [tab].concat(await getDescendants(tab.id));
    select(familyTabs);
}

async function selectDescendants(_, tab) {
    const descendantTabs = await getDescendants(tab.id);
    if (descendantTabs.length) {
        select(descendantTabs);
    }
}

async function selectSiteAndDescendants(_, tab) {
    const siteTabs = getSiteTabs(tab);
    let familyTabs = [].concat(siteTabs);
    for (const tab of siteTabs) {
        familyTabs = familyTabs.concat(await getDescendants(tab.id));
    }
    select(familyTabs);
}

async function selectSite(_, tab) {
    select(await getSiteTabs(tab));
}

function select(tabs) {
    browser.tabs.highlight({ tabs: tabs.map(t => t.index) });
}

async function getDescendants(tabId) {
    const childTabs = await browser.tabs.query({ currentWindow: true, openerTabId: tabId });
    let descendantTabs = [].concat(childTabs);
    for (const tab of childTabs) {
        descendantTabs = descendantTabs.concat(await getDescendants(tab.id));
    }
    return descendantTabs;
}

async function getSiteTabs(tab) {
    const host = (new URL(tab.url)).hostname;
    if (host) {
        return await browser.tabs.query({ currentWindow: true, url: `*://${host}/*` });
    }
}