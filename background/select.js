export default async function selectTabs(getter, targetTab) {
    let tabsToSelect = await getter(targetTab);

    const getterName = getter.name;
    const isParentGetter = getterName.includes('parent');
    const unpinnedIndex = tabsToSelect.findIndex(tab => !tab.pinned);

    // Include pinned tabs if any of these conditions are met
    const includePinned =
        targetTab.pinned ||
        isParentGetter ||
        // Is "add one left/right" command
        getterName.startsWith('add') ||
        // Is "invert selection" command, and pre-command selection had at least one pinned tab
        getterName === 'unselected' && (unpinnedIndex < 1 || unpinnedIndex > findMismatchedIndex(tabsToSelect));

    if (!includePinned) {
        // Remove pinned tabs
        tabsToSelect = unpinnedIndex === -1 ?
            [] : tabsToSelect.slice(unpinnedIndex);;
    }

    const tabCount = tabsToSelect.length;

    if (!tabCount)
        return;

    if (tabCount >= 2) {
        // Set up tabs for browser.tabs.highlight(), which will activate (put focus on) the first tab in array
        const indexToFocus = (
            // Move any of these available tabs to the start of the array: parent tab, currently focused tab, target tab
            // +1 to found indexes so that -1 becomes 0 (falsey)
            isParentGetter && findIdIndex(tabsToSelect, targetTab.openerTabId) + 1 ||
            tabsToSelect.findIndex(tab => tab.active) + 1 ||
            findIdIndex(tabsToSelect, targetTab.id) + 1
        ) - 1;
        if (indexToFocus >= 1) // If tab to focus is available and not already first in array
            [ tabsToSelect[0], tabsToSelect[indexToFocus] ] = [ tabsToSelect[indexToFocus], tabsToSelect[0] ]; // Swap with first tab
    }

    browser.tabs.highlight({ tabs: tabsToSelect.map(tab => tab.index), populate: false });
}

const findMismatchedIndex = tabs => tabs.findIndex((tab, index) => tab.index !== index);
const findIdIndex = (tabs, tabId) => tabs.findIndex(tab => tab.id === tabId);
