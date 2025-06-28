/**
 * @see {@link https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/API/tabs/Tab}
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
*/

/**
 * Name of a command's implementation function in get.js, and id of its associated menu item.
 * @typedef {string} CommandId
 */

/**
 * Superset of the menu item createProperties object.
 * Extra properties used only by this extension are indicated as such.
 * @see {@link https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/menus/create#createproperties}
 * @typedef CommandInfo
 * @property {string[]} contexts
 * @property {string} [accessKey] - Extra property; save in storage
 * @property {string} [category] - Extra property
 * @property {string} [parentId]
 * @property {string} [shortcut] - Extra property
 * @property {boolean} [showInTabMenu] - Extra property; save in storage
 * @property {string} [title]
 * @property {'separator'} [type]
 */

/** @typedef {object.<CommandId, CommandInfo>} CommandDict */

/**
 * @typedef StoredData
 * @property {object.<CommandId, { accessKey: string, showInTabMenu?: boolean }>} commands
 * @property {object.<string, any>} general
 */

// Common constants and functions //

export const MENU_ROOT = 'menuRoot';

/** @type {string} */
export const APP_NAME = browser.runtime.getManifest().name;

/**
 * Check for OS name in browser's user agent string.
 * @param {string} osName
 * @returns {boolean}
 */
export const isOS = osName => navigator.userAgent.indexOf(osName) !== -1;
