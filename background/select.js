/** @typedef {import('../common.js').Tab} Tab */

/**
 * @param {Function} getter
 * @param {Tab} targetTab
 * @param {Object} menuClickInfo
 */
export default async function selectTabs(getter, targetTab, menuClickInfo) {
    /** @type {Tab[]?} */
    let tabsToSelect = await getter(targetTab, menuClickInfo);
    if (!tabsToSelect)
        return;

    /** @type {string}  */ const getterName = getter.name;
    /** @type {boolean} */ const isParentGetter = getterName.includes('parent');
    /** @type {number}  */ const unpinnedIndex = tabsToSelect.findIndex(tab => !tab.pinned);

    // Include pinned tabs if any of these conditions are met
    /** @type {boolean} */
    const includePinned =
        targetTab.pinned ||
        isParentGetter ||
        // Is directional "x left/right" command
        getterName.startsWith('add') || getterName.startsWith('trail') ||
        // Is "invert selection" command, and pre-command selection had at least one pinned tab
        getterName === 'unselected' && (unpinnedIndex < 1 || unpinnedIndex > findMismatchedIndex(tabsToSelect));

    if (!includePinned) {
        // Remove pinned tabs
        if (unpinnedIndex === -1)
            return; // No unpinned tabs so do nothing
        tabsToSelect = tabsToSelect.slice(unpinnedIndex);
    }

    if (menuClickInfo.modifiers.includes('Shift')) {
        // Keep current selection, combine with new selection
        const currentSelectedTabs = await browser.tabs.query({ currentWindow: true, highlighted: true });
        tabsToSelect = tabsToSelect.concat(currentSelectedTabs);
    }

    /** @type {number} */
    const tabCount = tabsToSelect.length;

    if (!tabCount)
        return;

    if (tabCount >= 2) {
        // Set up tabs for browser.tabs.highlight(), which will activate (put focus on) the first tab in array
        const indexToFocus = (
            // Move any of these available tabs to the start of the array
            // +1 to found indexes so that -1 (not found) becomes 0 (falsey)
            isParentGetter && findIdIndex(tabsToSelect, targetTab.openerTabId) + 1 || // Parent tab
            tabsToSelect.findIndex(tab => tab.active) + 1 || // Currently focused tab
            findIdIndex(tabsToSelect, targetTab.id) + 1 // Target tab
        ) - 1; // Revert 0 to -1
        if (indexToFocus >= 1) // If tab to focus is available and not already first in array
            [ tabsToSelect[0], tabsToSelect[indexToFocus] ] = [ tabsToSelect[indexToFocus], tabsToSelect[0] ]; // Swap with first tab
    }

    browser.tabs.highlight({ tabs: tabsToSelect.map(tab => tab.index), populate: false });
}

/**
 * @param {Tab[]} tabs
 * @returns {number}
 */
const findMismatchedIndex = tabs => tabs.findIndex((tab, arrayIndex) => tab.index !== arrayIndex);
/**
 * @param {Tab[]} tabs
 * @param {number} tabId
 * @returns {number}
 */
const findIdIndex = (tabs, tabId) => tabs.findIndex(tab => tab.id === tabId);
