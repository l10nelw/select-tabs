'use strict';

const menu = {
    select_parent: `&Parent`,
    select_parent_descendants: `P&arent and Descendants`,
    select_siblings_descendants: `&Siblings and Descendants`,
    select_tab_descendants: `&Tab and Descendants`,
    select_descendants: `&Descendants`,
    select_site: `Sa&me Site Tabs`,
    select_site_descendants: `Sam&e Site Tabs and Descendants`,
}

for (const id in menu) {
    browser.contextMenus.create({
        id,
        title: menu[id],
        onclick: window[id],
        contexts: ['tab'],
    });
}

function select_parent(_, tab) {
    const parentTabId = tab.openerTabId;
    if (parentTabId) {
        browser.tabs.update(parentTabId, { active: true });
    }
}

async function select_parent_descendants(_, tab) {
    const parentTabId = tab.openerTabId;
    if (parentTabId) {
        const tabPromises = [browser.tabs.get(parentTabId), getDescendants(parentTabId)];
        const familyTabs = (await Promise.all(tabPromises)).flat();
        select(familyTabs);
    } else {
        select_tab_descendants(_, tab);
    }
}

async function select_siblings_descendants(_, tab) {
    const familyTabs = await getDescendants(tab.openerTabId);
    select(familyTabs);
}

async function select_tab_descendants(_, tab) {
    const familyTabs = [tab].concat(await getDescendants(tab.id));
    select(familyTabs);
}

async function select_descendants(_, tab) {
    const descendantTabs = await getDescendants(tab.id);
    if (descendantTabs.length) {
        select(descendantTabs);
    }
}

async function select_site_descendants(_, tab) {
    const siteTabs = getSiteTabs(tab);
    let familyTabs = [].concat(siteTabs);
    for (const tab of siteTabs) {
        familyTabs = familyTabs.concat(await getDescendants(tab.id));
    }
    select(familyTabs);
}

async function select_site(_, tab) {
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