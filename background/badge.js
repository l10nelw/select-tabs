/** @import { Tab } from '../common.js' */

browser.action.setBadgeBackgroundColor({ color: 'black' });

export function clear() {
    browser.action.setBadgeText({ text: '' });
}

/**
 * Show count of `selectedTabs` in the badge. If count=0 clearly show there was an aborted selection.
 * @param {Tab[]} selectedTabs
 */
export function update(selectedTabs) {
    const count = selectedTabs.length;
    browser.action.setBadgeText({ text: count ? `${count}` : '🚫' });
}
