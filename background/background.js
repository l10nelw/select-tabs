import * as Getter from './get.js';
import selectTabs from './select.js';
import menuData from '../menudata.js';

init();

async function init() {
    const preferences = await browser.storage.sync.get();

    buildMenu(menuData, new Set(preferences.disabledCommands));

    browser.contextMenus.onClicked.addListener(
        ({ menuItemId }, tab) => selectTabs(Getter[menuItemId], tab)
    );

    browser.runtime.onMessage.addListener(async request => {
        if (request === 'preferences')
            return preferences;
    });
}

// menuGroupDict is an dict of group titles mapped to dicts of getter names mapped to getter titles
function buildMenu(menuGroupDict, disabledItemSet) {
    const contexts = ['tab'];
    const parentId = 'selecttabs';
    const parentTitle = '&Select Tabs';

    const addRoot = ()          => browser.contextMenus.create({ contexts, id: parentId, title: parentTitle });
    const addItem = (id, title) => browser.contextMenus.create({ contexts, parentId, id, title });
    const addSeparator = ()     => browser.contextMenus.create({ contexts, parentId, type: 'separator' });

    const removeDisabled = disabledItemSet.size ?
        (_, id, map) => {
            if (disabledItemSet.has(id))
                map.delete(id);
        } : null;

    addRoot();

    const menuGroups = Object.values(menuGroupDict);
    for (let i = 0, n = menuGroups.length; i < n; i++) {
        const menuGroupItemMap = new Map(Object.entries(menuGroups[i]));
        if (removeDisabled)
            menuGroupItemMap.forEach(removeDisabled);
        if (i > 0 && menuGroupItemMap.size)
            addSeparator(); // A separator prefaces each non-first, non-empty group
        for (const [id, title] of menuGroupItemMap.entries())
            addItem(id, title);
    }
}
