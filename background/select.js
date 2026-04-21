import * as GETTER from './get.js';
import COMMAND_DICT from '../commands.js';

/** @import { CommandId, MenuClickInfo, Tab } from '../common.js' */

/**
 * @param {CommandId} commandId
 * @param {Tab} [targetTab]
 * @param {MenuClickInfo} [menuClickInfo]
 * @returns {Promise<Tab[]>}
 */
export default async function selectTabs(commandId, targetTab, menuClickInfo) {
    const preSelection = await getSelectedTabs();
    targetTab ??= preSelection.find(tab => tab.active);

    /** @type {Tab[]?} */
    const tabsToSelect = await GETTER[commandId](targetTab, preSelection, menuClickInfo);
    if (!tabsToSelect)
        return [];

    // For the "Undo" command
    browser.storage.session.set({ preSelection });

    const unpinnedIndex = tabsToSelect.findIndex(tab => !tab.pinned);
    /** Include pinned tabs if any of these conditions are met. */
    const includePinned = Boolean(
        targetTab.pinned
        || COMMAND_DICT[commandId].alwaysIncludePinned
        || (commandId === 'unselected' && preSelection[0].pinned) // Is "invert selection" command and the pre-command selection had at least one pinned tab
    );
    if (!includePinned) {
        if (unpinnedIndex === -1)
            return []; // Can't include pinned tabs, but no unpinned tabs, so do nothing
        tabsToSelect.splice(0, unpinnedIndex); // Remove pinned tabs
    }

    if (menuClickInfo?.modifiers.includes('Shift'))
        tabsToSelect.push(...preSelection); // Add current selection to the new selection

    const tabCount = tabsToSelect.length;
    if (!tabCount)
        return [];

    if (tabCount >= 2) {
        // Move to the start of the array a suitable tab within `tabsToSelect`, since `browser.tabs.highlight()` will activate the first tab in array
        let arrayIndexToActivate = tabsToSelect.findIndex(tab => tab.active); // The active tab
        if (arrayIndexToActivate === -1)
            arrayIndexToActivate = tabsToSelect.indexOf(findBestClosestToTargetTab(tabsToSelect, targetTab)); // Closest loaded tab, or otherwise any closest tab, to the target tab
        if (arrayIndexToActivate > 0) // If tab to activate is not already first in array
            [ tabsToSelect[0], tabsToSelect[arrayIndexToActivate] ] = [ tabsToSelect[arrayIndexToActivate], tabsToSelect[0] ]; // Swap with first tab
    }

    await browser.tabs.highlight({ tabs: tabsToSelect.map(tab => tab.index), populate: false });
    return getSelectedTabs();
}

/**
 * Among `candidateTabs` (sorted by `tab.index`), find the one positionally closest to the `targetTab`, non-discarded (loaded) if possible.
 * Prefer the right in a tie between two tabs.
 * @param {Tab[]} candidateTabs
 * @param {Tab} targetTab
 * @returns {Tab}
 */
function findBestClosestToTargetTab(candidateTabs, targetTab) {
    const targetTabIndex = targetTab.index;

    // If there are any non-discarded candidates, shortlist them
    const loadedTabs = candidateTabs.filter(tab => !tab.discarded);
    if (loadedTabs.length)
        candidateTabs = loadedTabs;

    let closestTab = candidateTabs[0];
    if (targetTabIndex <= closestTab.index)
        return closestTab;
    closestTab = candidateTabs.at(-1);
    if (targetTabIndex >= closestTab.index)
        return closestTab;

    let smallestIndexGap = closestTab.index;
    for (const tab of candidateTabs) {
        const tabIndex = tab.index;
        if (tabIndex === targetTabIndex) // Zero gap
            return targetTab;
        const indexGap = Math.abs(tabIndex - targetTabIndex);
        if (indexGap === smallestIndexGap) // There are two candidates equally closest to target (target lies midway between them)
            return tab; // Return the latter candidate
        if (indexGap > smallestIndexGap) // Gap has grown
            break; // Therefore the closest candidate was already found in the previous iteration
        // Gap is shrinking, so continue
        smallestIndexGap = indexGap;
        closestTab = tab;
    }
    return closestTab;
}

/**
 * @returns {Promise<Tab[]>}
 */
const getSelectedTabs = () => browser.tabs.query({ currentWindow: true, highlighted: true });
