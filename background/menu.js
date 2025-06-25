import * as Commands from '../commands.js';
import { isOS } from '../common.js';

/** @typedef {import('../common.js').CommandId} CommandId */
/** @typedef {import('../common.js').CommandInfo} CommandInfo */
/** @typedef {import('../common.js').CommandDict} CommandDict */


export async function populate() {
    browser.menus.removeAll();

    const SUPPORTS_ACCESSKEYS = !isOS('Mac OS'); // We want to avoid "title (key)" in MacOS
    const parentId = 'menuRoot';
    const separatorInfo = { parentId, contexts: ['tab'], type: 'separator' };

    /** @type {{ commands: CommandDict, shownTabMenuItems: Set<CommandId> }} */
    const { commands, shownTabMenuItems } = await Commands.getData();

    /**
     * @param {CommandId?} id
     * @param {CommandInfo} info
     */
    function addItem(id, { contexts, parentId, type, title, accessKey }) {
        const item = { id, contexts, parentId, type };
        item.title = SUPPORTS_ACCESSKEYS ?
            indicateAccessKey(title, accessKey) :
            title;
        browser.menus.create(item);
    }

    // Add parent menu item
    addItem(parentId, commands[parentId]);
    delete commands[parentId];

    // Iterate through remaining commands
    let currentCategory = '';
    for (const [commandId, commandInfo] of Object.entries(commands)) {
        if (shownTabMenuItems.has(commandId)) {
            // Add seperator at every change of category
            if (commandInfo.category !== currentCategory) {
                if (currentCategory)
                    addItem(null, separatorInfo);
                currentCategory = commandInfo.category;
            }
        } else {
            // Handle disabled tab context menu-items
            const contexts = new Set(commandInfo.contexts);
            contexts.delete('tab');
            if (!contexts.size)
                continue; // Skip command if no contexts remain
            commandInfo.contexts = [...contexts];
        }
        addItem(commandId, commandInfo);
    }
}

const LESS_PREFERRED_WORDS = new Set(['and', 'the', 'to', 'in']);

/**
* @param {string} title
* @param {string} [accessKey]
* @returns {string}
*/
function indicateAccessKey(title, accessKey) {
    if (!accessKey)
        return title;
    const words = title.split(' ');
    for (let i = 0, n = words.length; i < n; i++) {
        const word = words[i];
        const lcWord = word.toLowerCase();
        if (LESS_PREFERRED_WORDS.has(lcWord))
            continue;
        const index = lcWord.indexOf(accessKey);
        if (index !== -1) {
            words[i] = insertAmpersand(word, index);
            return words.join(' ');
        }
    }
    const index = title.toLowerCase().indexOf(accessKey);
    if (index !== -1)
        return insertAmpersand(title, index);
    return `${title} (&${accessKey.toUpperCase()})`; // Display "title (key)"
}

/**
 * @param {string} str
 * @param {number} index
 * @returns {string}
 */
const insertAmpersand = (str, index) => str.slice(0, index) + '&' + str.slice(index);
