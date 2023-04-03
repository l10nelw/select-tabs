import * as GetTabs from './get.js'; // Tab getters (menu commands)
import selectTabs from './select.js'; // Selects tabs returned by getter
import MENU_DICT from '../menudata.js';
import { cleanTitle } from '../utils.js';

(async function init() {
    const preferences = await browser.storage.sync.get();
    setCommandDescriptions(MENU_DICT);
    buildMenu(MENU_DICT, new Set(preferences.disabledCommands));
})();

browser.contextMenus.onClicked.addListener(({ menuItemId }, targetTab) => {
    selectTabs(GetTabs[menuItemId], targetTab);
});

browser.commands.onCommand.addListener(async (command) => {
    const focusedTab = (await browser.tabs.query({ currentWindow: true, active: true }))[0];
    selectTabs(GetTabs[command], focusedTab);
});

function setCommandDescriptions(groupDict) {
    for (const [group, commandDict] of Object.entries(groupDict))
        for (const [name, title] of Object.entries(commandDict))
            browser.commands.update({ name, description: `${group}: ${cleanTitle(title)}` });
}

// menuGroupDict is an dict of { group titles : { getter names : getter titles } }
function buildMenu(groupDict, disabledItemSet) {
    const contexts = ['tab'];
    const parentId = 'selecttabs';
    const parentTitle = '&Select Tabs';

    const addRoot = ()          => browser.contextMenus.create({ contexts, id: parentId, title: parentTitle });
    const addItem = (id, title) => browser.contextMenus.create({ contexts, parentId, id, title });
    const addSeparator = ()     => browser.contextMenus.create({ contexts, parentId, type: 'separator' });

    // If there are disabled items, set removeDisabledItem as a function, otherwise set to null
    const removeDisabledItem = disabledItemSet.size ?
        (_, id, itemMap) => {
            if (disabledItemSet.has(id))
                itemMap.delete(id);
        } : null;

    addRoot();

    const groups = Object.values(groupDict);
    let first = true;
    for (let group of groups) {
        group = new Map(Object.entries(group));

        // Filter out disabled items to get correct group size
        if (removeDisabledItem)
            group.forEach(removeDisabledItem);

        // A separator prefaces each non-first, non-empty group
        if (!first && group.size)
            addSeparator();

        for (const [id, title] of group.entries())
            addItem(id, title);

        first = false;
    }
}
