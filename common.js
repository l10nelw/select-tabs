/**
 * @typedef Tab
 * @property {boolean} active
 * @property {string} cookieStoreId
 * @property {number} groupId
 * @property {boolean} highlighted
 * @property {number} index
 * @property {boolean} isInReaderMode
 * @property {number} lastAccessed
 * @property {number} [openerTabId]
 * @property {string} title
 * @property {string} url
 * @see {@link https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/API/tabs/Tab}
*/

/**
 * Name of a command's implementation function in get.js, and id of its associated menu item.
 * @typedef {string} CommandId
 */

/**
 * Superset of the menu item createProperties object. Extra properties indicated as "Select Tabs only".
 * @see {@link https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/menus/create#createproperties}
 * @typedef CommandInfo
 * @property {string[]} contexts
 * @property {string} [accessKey] - Added by Select Tabs
 * @property {string} [category] - Added by Select Tabs
 * @property {string} [parentId]
 * @property {string} [shortcut] - Added by Select Tabs
 * @property {string} [title]
 * @property {'separator'} [type]
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
