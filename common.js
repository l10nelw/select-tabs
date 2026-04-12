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
 * @property {boolean} pinned
 * @property {string} title
 * @property {string} url
*/

/**
 * @see {@link https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/API/menus/OnClickData}
 * @typedef MenuClickInfo
 * @property {string} [linkText]
 * @property {CommandId} menuItemId
 * @property {string[]} modifiers
 * @property {string} [selectionText]
*/

/** @typedef {string} CommandId - Name of a command's implementation function in get.js, and id of its associated menu item. */
/** @typedef {object<CommandId, CommandInfo>} CommandDict */
/** @typedef {_CommandInfo & CommandInfoStored} CommandInfo */
/**
 * Superset of the menu item createProperties object.
 * Extra properties used only by this extension are indicated.
 * @see {@link https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/menus/create#createproperties}
 * @typedef _CommandInfo
 * @property {string[]} contexts
 * @property {boolean} [alwaysIncludePinned] - Extra property
 * @property {string} [category] - Extra property
 * @property {string} [parentId]
 * @property {string} [shortcut] - Extra property
 * @property {string} [title]
 * @property {'separator'} [type]
 */
/**
 * One of the menu item ContextTypes, or the 'popup' ContextType which is used only by this extension.
 * @see {@link https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/menus/ContextType}
 * @typedef {'tab'|'link'|'selection'|'popup'} ContextType
 */
/**
 * Extra properties that are stored.
 * @typedef CommandInfoStored
 * @property {string} [accessKey]
 * @property {boolean} [showInTabMenu]
*/

/**
 * User-defined data, longterm storage.
 * @typedef StoredData
 * @property {object.<CommandId, CommandInfoStored>} commands
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
