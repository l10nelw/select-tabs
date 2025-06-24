/**
 * @typedef {object.<string, any>} Tab
 * @see {@link https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/API/tabs/Tab}
*/

/**
 * Name of a command's implementation function in get.js, and id of its associated menu item.
 * @typedef {string} CommandId
 */

/**
 * Superset of the menu item createProperties object. Extra properties indicated as "Select Tabs only".
 * @see {@link https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/menus/create#createproperties}
 * @typedef {object.<string, any>} CommandInfo
 * @property {string[]} contexts
 * @property {string} [accessKey] - Select Tabs only
 * @property {string} [category] - Select Tabs only
 * @property {string} [parentId]
 * @property {string} [shortcut] - Select Tabs only
 * @property {string} [title]
 */

/** @typedef {object.<CommandId, CommandInfo>} CommandDict */

/**
 * @typedef StoredData
 * @property {object.<string, any>} general
 * @property {CommandId[]} shownTabMenuItems
 * @property {object.<CommandId, string>} accessKeys
 */

/**
 * Check for OS name in browser's user agent string.
 * @param {string} osName
 * @returns {boolean}
 */
export const isOS = osName => navigator.userAgent.indexOf(osName) !== -1;
