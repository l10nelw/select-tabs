import * as Getter from './get.js';

/** @typedef {import('../common.js').Tab} Tab */
/** @typedef {import('../common.js').CommandId} CommandId */

/**
 * Commands that always include pinned tabs in output.
 * @type {Set<CommandId>}
 */
const PIN_AGNOSTIC_COMMANDS = new Set([
    'parent', 'parent__descendants',
    'addLeft', 'addRight', 'trailLeft', 'trailRight',
    'switchToHere', 'cycleForward', 'cycleBackward',
]);

/**
 * @param {CommandId} commandId
 * @param {Tab} targetTab
 * @param {object} [menuClickInfo]
 * @param {string[]} menuClickInfo.modifiers
 */
export default async function selectTabs(commandId, targetTab, menuClickInfo) {
    /** @type {Tab[]?} */
    let tabsToSelect = await Getter[commandId](targetTab, menuClickInfo);
    if (!tabsToSelect)
        return;

    const unpinnedIndex = tabsToSelect.findIndex(tab => !tab.pinned);

    // Include pinned tabs if any of these conditions are met
    /** @type {boolean} */ const includePinned =
        targetTab.pinned ||
        PIN_AGNOSTIC_COMMANDS.has(commandId) ||
        // Is "invert selection" command, and we infer that the pre-command selection had at least one pinned tab
        commandId === 'unselected' && (unpinnedIndex === 0 || unpinnedIndex > findMismatchedIndex(tabsToSelect));
    if (!includePinned) {
        // Remove pinned tabs
        if (unpinnedIndex === -1)
            return; // No unpinned tabs so do nothing
        tabsToSelect = tabsToSelect.slice(unpinnedIndex);
    }

    if (menuClickInfo?.modifiers.includes('Shift'))
        tabsToSelect.push(...await selected()); // Add current selection to the new selection

    const tabCount = tabsToSelect.length;

    if (!tabCount)
        return;

    if (tabCount >= 2) {
        // Set up tabs for browser.tabs.highlight(), which will activate (put focus on) the first tab in array
        const indexToFocus = (
            // Move any of these available tabs to the start of the array
            // +1 to found indexes so that -1 (not found) becomes 0 (falsey), allowing this OR-operation to work
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
