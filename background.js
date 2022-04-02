import * as GetTabs from './gettabs.js';

buildMenu({
    // function/menuItemId: title
    sameSite:               '&Same Site',
    sameSite__descendants:  'Sa&me Site and Descendants',
    sameSite__cluster:      'Same Site &Cluster',
    _0:                     '',
    left:                   'To the &Left',
    right:                  'To the &Right',
    _1:                     '',
    descendants:            '&Descendants',
    parent:                 '&Parent',
    parent__descendants:    'P&arent and Descendants',
    siblings:               'S&iblings',
    siblings__descendants:  'Si&blings and Descendants',
});

function buildMenu(menuItems) {
    const contexts = ['tab'];
    const parentId = 'selecttabs';

    browser.contextMenus.create({
        contexts,
        id: parentId,
        title: '&Select Tabs',
    });

    for (const [id, title] of Object.entries(menuItems)) {
        const isMenuItem = title.length;
        if (isMenuItem) {
            browser.contextMenus.create({
                contexts,
                parentId,
                title,
                onclick: (info, tab) => selectTabs(GetTabs[id], tab),
            });
        }
        else {
            browser.contextMenus.create({
                contexts,
                parentId,
                type: 'separator',
            });
        }
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
