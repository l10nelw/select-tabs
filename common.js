/**
 * @typedef {Object<string, any>} Tab
 * @see {@link https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/API/tabs/Tab}
 */

/** @typedef {string} CommandId */
/**
 * @typedef {Object} CommandInfo
 * @property {string[]} contexts
 * @property {string} [accessKey]
 * @property {string} [category]
 * @property {string} [parentId]
 * @property {string} [shortcut]
 * @property {string} [title]
 */
/** @typedef {Object<CommandId, CommandInfo>} CommandDict */

/**
 * Check for OS name in browser's user agent string.
 * @param {string} osName
 * @returns {boolean}
 */
export const isOS = osName => navigator.userAgent.indexOf(osName) !== -1;
