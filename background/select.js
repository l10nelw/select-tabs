import { parent as getParent } from './get.js';

export default async function selectTabs(getter, targetTab) {
    let tabsToSelect = await getter(targetTab);

    const isParentGetter = getter.name.includes('parent');
    const doIncludePinned = targetTab.pinned || isParentGetter; // Conditions for including pinned tabs

    if (!doIncludePinned)
        tabsToSelect = removePinned(tabsToSelect);

    const tabCount = tabsToSelect.length;

    if (!tabCount)
        return;

    // Focus on target's parent if relevant, otherwise:
    // focus on either currently focused tab, target, or leftmost tab
    const parentTab = (isParentGetter && tabCount >= 1) && (await getParent(targetTab))[0];
    const keepCurrentFocus = !parentTab;
    prepTabToFocus(tabsToSelect, keepCurrentFocus, parentTab || targetTab);

    browser.tabs.highlight({ tabs: tabsToSelect.map(tab => tab.index), populate: false });
}

function removePinned(tabs) {
    const unpinnedIndex = tabs.findIndex(tab => !tab.pinned);
    return (unpinnedIndex === -1) ? [] : tabs.slice(unpinnedIndex);
}

// Set up `tabs` array for tabs.highlight(), which focuses (activates) the first tab in array.
// Moves a particular tab, if available, to the start of the `tabs` array.
// That tab is either: the currently focused tab if `keepCurrentFocus` is true, or the given `tab`.
// If neither is available, nothing is moved; the first tab in the array is "prepped" for focus.
function prepTabToFocus(tabs, keepCurrentFocus, tab) {
    if (tabs.length <= 1)
        return;

    let indexToFocus = keepCurrentFocus ? tabs.findIndex(t => t.active) : -1;

    if (indexToFocus === -1) {
        const tabId = tab.id;
        indexToFocus = tabs.findIndex(t => t.id === tabId);
    }

    if (indexToFocus >= 1)
        [ tabs[0], tabs[indexToFocus] ] = [ tabs[indexToFocus], tabs[0] ]; // Swap with first tab
}
