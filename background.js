'use strict';

const menu = {
    select_parent: `&Parent`,
    select_tab_parent_descendants: `Tab, Pa&rent and Descendants`,
    select_tab_siblings_descendants: `Tab, &Siblings and Descendants`,
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

async function select_tab_parent_descendants(_, tab) {
    const parentTabId = tab.openerTabId;
    if (parentTabId) {
        const [parentTab, descendantTabs] = await Promise.all([browser.tabs.get(parentTabId), getDescendants(parentTabId)]);
        select(descendantTabs.concat(parentTab));
    } else {
        select_tab_descendants(_, tab);
    }
}

async function select_tab_siblings_descendants(_, tab) {
    const descendantTabs = await getDescendants(tab.openerTabId);
    select(descendantTabs);
}

async function select_tab_descendants(_, tab) {
    const descendantTabs = (await getDescendants(tab.id)).concat(tab);
    select(descendantTabs);
}

async function select_descendants(_, tab) {
    const descendantTabs = await getDescendants(tab.id);
    if (descendantTabs.length) {
        select(descendantTabs);
    }
}

async function select_site_descendants(_, tab) {
    const siteTabs = getSiteTabs(tab);
    let descendantTabs = [].concat(siteTabs);
    for (const tab of siteTabs) {
        descendantTabs = descendantTabs.concat(await getDescendants(tab.id));
    }
    select(descendantTabs);
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