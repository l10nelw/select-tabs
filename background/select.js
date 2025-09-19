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
        tabsToSelect.push(...await Getter.selected()); // Add current selection to the new selection

    const tabCount = tabsToSelect.length;

    if (!tabCount)
        return;

    // Set up tabs for browser.tabs.highlight() shortly, which will activate the first tab in array
    if (tabCount >= 2) {
        // Move to the start of the array a suitable tab within tabsToSelect, which meets one of the criteria
        // +1 to found indexes so that -1 (not found) becomes 0 (falsey), allowing this OR-chain to work
        const arrayIndexToActivate = (
            tabsToSelect.findIndex(tab => tab.active) // Active tab in tabsToSelect
            + 1 ||
            findIdIndex(tabsToSelect, targetTab.id) // Target tab in tabsToSelect
            + 1 ||
            tabsToSelect.indexOf(findClosestToTargetTab(tabsToSelect, targetTab)) // Closest to target tab among tabsToSelect
            + 1
        ) - 1; // Revert 0 to -1
        if (arrayIndexToActivate > 0) // If tab to activate is not already first in array
            [ tabsToSelect[0], tabsToSelect[arrayIndexToActivate] ] = [ tabsToSelect[arrayIndexToActivate], tabsToSelect[0] ]; // Swap with first tab
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

/**
 * Among candidiate `tabs` (sorted by `tab.index`), find the one positionally closest to the `targetTab`.
 * Prefer the right in a tie between two tabs.
 * @param {Tab[]} tabs
 * @param {Tab} targetTab
 * @returns {Tab}
 */
function findClosestToTargetTab(tabs, targetTab) {
    const targetTabIndex = targetTab.index;
    /** @type {Tab} */ let closestTab = tabs.at(-1);

    if (targetTabIndex >= closestTab.index)
        return closestTab;

    let smallestIndexGap = closestTab.index;
    for (const tab of tabs) {
        const tabIndex = tab.index;
        if (tabIndex === targetTabIndex)
            return targetTab; // Zero gap
        const indexGap = Math.abs(tabIndex - targetTabIndex);
        if (indexGap === smallestIndexGap) // There are two candidiate tabs equally closest to target (target lies midway between them)
            return tab; // Return the latter tab
        if (indexGap > smallestIndexGap) // Gap has grown
            break; // Therefore the closest candidiate tab was already found in the previous iteration
        // Gap is shrinking, so continue
        smallestIndexGap = indexGap;
        closestTab = tab;
    }

    return closestTab;
}
