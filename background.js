import * as GetTabs from './gettabs.js';

buildMenu({
    'URL-based': {
        duplicate:              'D&uplicate',
        sameSite:               '&Same Site',
        sameSite__cluster:      'Same Site &Cluster',
        sameSite__descendants:  'Sa&me Site and Descendants',
    },
    'Directional': {
        left:                   'To the &Left',
        right:                  'To the &Right',
    },
    'Tab-tree': {
        descendants:            '&Descendants',
        parent:                 '&Parent',
        parent__descendants:    'P&arent and Descendants',
        siblings:               'S&iblings',
        siblings__descendants:  'Si&blings and Descendants',
    },
});

// menuGroupDict is an dict of group titles mapped to dicts of getter names mapped to getter titles
function buildMenu(menuGroupDict) {
    const contexts = ['tab'];
    const parentId = 'selecttabs';
    addRoot();

    const menuGroups = Object.values(menuGroupDict);
    for (let i = 0, n = menuGroups.length; i < n; i++) {
        const menuGroupItems = Object.entries(menuGroups[i]);
        if (i > 0 && menuGroupItems.length)
            addSeparator(); // A separator prefaces each non-first, non-empty group
        for (const [id, title] of menuGroupItems)
            addItem(id, title);
    }

    function addRoot() {
        browser.contextMenus.create({
            contexts,
            id: parentId,
            title: '&Select Tabs',
        });
    }

    function addItem(id, title) {
        browser.contextMenus.create({
            contexts,
            parentId,
            title,
            onclick: (_, tab) => selectTabs(GetTabs[id], tab),
        });
    }

    function addSeparator() {
        browser.contextMenus.create({
            contexts,
            parentId,
            type: 'separator',
        });
    }
}

async function selectTabs(getter, targetTab) {
    let tabs = await getter(targetTab);
    if (getter !== GetTabs.parent)
        tabs = removePinned(tabs); // Allow pinned tabs only for Parent command
    if (!tabs?.length)
        return;
    prepActiveTab(tabs, targetTab);
    const tabIndexes = tabs.map(tab => tab.index);
    browser.tabs.highlight({ tabs: tabIndexes, populate: false });
}

function removePinned(tabs) {
    const unpinnedIndex = tabs.findIndex(tab => !tab.pinned);
    return (unpinnedIndex === -1) ? [] : tabs.slice(unpinnedIndex);
}

// Move the active tab or target tab to the start of the tabs array, if either is available.
// Sets up array for tabs.highlight(), which activates the first tab in array.
function prepActiveTab(tabs, targetTab) {
    if (tabs.length < 2)
        return;
    let activeTabIndex = tabs.findIndex(tab => tab.active);
    if (activeTabIndex === -1) {
        const targetTabId = targetTab.id;
        activeTabIndex = tabs.findIndex(tab => tab.id === targetTabId);
    }
    if (activeTabIndex > 0)
        [ tabs[0], tabs[activeTabIndex] ] = [ tabs[activeTabIndex], tabs[0] ];
}
