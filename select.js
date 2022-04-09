export default async function selectTabs(getter, targetTab) {
    let tabs = await getter(targetTab);

    if (targetTab.pinned || getter.name === 'parent') {
        // Allow selecting pinned tabs
    } else {
        tabs = removePinned(tabs);
    }

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
