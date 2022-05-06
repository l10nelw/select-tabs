export default async function selectTabs(getter, targetTab) {
    let tabs = await getter(targetTab);

    // Allow selecting pinned tabs only if target is pinned or getter is `parent`
    if (!(targetTab.pinned || getter.name === 'parent'))
        tabs = removePinned(tabs);

    if (!tabs?.length)
        return;

    prepActiveTab(tabs, targetTab);
    browser.tabs.highlight({ tabs: tabs.map(tab => tab.index), populate: false });
}

function removePinned(tabs) {
    const unpinnedIndex = tabs.findIndex(tab => !tab.pinned);
    return (unpinnedIndex === -1) ? [] : tabs.slice(unpinnedIndex);
}

// Move the active tab or target tab to the start of the tabs array, if either is available
// Mutates array; sets it up for tabs.highlight(), which activates (focuses) the first tab in array
// In other words: keep active tab active, or activate target tab, or activate first tab in selection
function prepActiveTab(tabs, targetTab) {
    if (tabs.length <= 1)
        return;
    let activeTabIndex = tabs.findIndex(tab => tab.active);
    if (activeTabIndex === -1) {
        const targetTabId = targetTab.id;
        activeTabIndex = tabs.findIndex(tab => tab.id === targetTabId);
    }
    if (activeTabIndex >= 1)
        [ tabs[0], tabs[activeTabIndex] ] = [ tabs[activeTabIndex], tabs[0] ]; // Swap with first tab
}
