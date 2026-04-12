import { MENU_ROOT as parentId, isOS } from '../common.js';

/** @import { CommandId, CommandInfo, CommandDict } from '../common.js' */

/**
 * @param {CommandDict} commandDict
 */
export function populate(commandDict) {
    commandDict = { ...commandDict };
    browser.menus.removeAll();

    const SUPPORTS_ACCESSKEYS = !isOS('Mac OS'); // We want to avoid "title (key)" in MacOS
    const separatorInfo = { parentId, contexts: ['tab'], type: 'separator' };

    /**
     * @param {CommandId} id
     * @param {CommandInfo} info
     */
    function addItem(id, { contexts, parentId, type, title, accessKey }) {
        const item = { id, contexts, parentId, type };
        item.title = SUPPORTS_ACCESSKEYS
            ? indicateAccessKey(title, accessKey)
            : title;
        browser.menus.create(item);
    }

    // Add parent menu item
    addItem(parentId, commandDict[parentId]);
    delete commandDict[parentId];

    // Iterate through remaining commands
    let currentCategory = '';
    for (const commandId in commandDict) {
        /** @type {CommandInfo} */
        const commandInfo = commandDict[commandId];
        const contextSet = new Set(commandInfo.contexts);
        contextSet.delete('popup'); // popup context doeesn't belong here, remove for all commands

        if (commandInfo.showInTabMenu) {
            // Add seperator at every change of category
            if (commandInfo.category !== currentCategory) {
                if (currentCategory)
                    addItem(`_${currentCategory}`, separatorInfo);
                currentCategory = commandInfo.category;
            }
        } else {
            // Handle disabled tab context menu-items
            contextSet.delete('tab');
            if (!contextSet.size)
                continue; // Skip command if no contexts remain
        }

        commandInfo.contexts = [...contextSet];
        addItem(commandId, commandInfo);
    }
}

const LESS_PREFERRED_WORDS = new Set(['and', 'or', 'the', 'a', 'an', 'to', 'in', 'for']);

/**
* @param {string} title
* @param {string} [accessKey]
* @returns {string}
*/
function indicateAccessKey(title, accessKey) {
    if (!accessKey)
        return title;
    // Find uppercase match
    const ucAccessKey = accessKey.toUpperCase();
    let index = title.indexOf(ucAccessKey);
    if (index >= 0)
        return insertAmpersand(title, index);
    // Find match avoiding common words
    const words = title.split(' ');
    for (let i = 0, n = words.length; i < n; i++) {
        const word = words[i];
        const lcWord = word.toLowerCase();
        if (LESS_PREFERRED_WORDS.has(lcWord))
            continue;
        index = lcWord.indexOf(accessKey);
        if (index >= 0) {
            words[i] = insertAmpersand(word, index);
            return words.join(' ');
        }
    }
    // Find match anywhere
    index = title.toLowerCase().indexOf(accessKey);
    if (index >= 0)
        return insertAmpersand(title, index);
    // No match found
    return `${title} (&${ucAccessKey})`; // Display "title (key)"
}

/**
 * @param {string} text
 * @param {number} index
 * @returns {string}
 */
const insertAmpersand = (text, index) => text.slice(0, index) + '&' + text.slice(index);
