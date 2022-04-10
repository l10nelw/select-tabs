import * as Getter from './get.js';
import selectTabs from './select.js';
import menuData from './menudata.js';

buildMenu(menuData);

// menuGroupDict is an dict of group titles mapped to dicts of getter names mapped to getter titles
function buildMenu(menuGroupDict) {
    const contexts = ['tab'];
    const parentId = 'selecttabs';
    const parentTitle = '&Select Tabs';

    const addRoot = ()          => browser.contextMenus.create({ contexts, id: parentId, title: parentTitle });
    const addItem = (id, title) => browser.contextMenus.create({ contexts, parentId, id, title });
    const addSeparator = ()     => browser.contextMenus.create({ contexts, parentId, type: 'separator' });

    addRoot();

    const menuGroups = Object.values(menuGroupDict);
    for (let i = 0, n = menuGroups.length; i < n; i++) {
        const menuGroupItems = Object.entries(menuGroups[i]);
        if (i > 0 && menuGroupItems.length)
            addSeparator(); // A separator prefaces each non-first, non-empty group
        for (const [id, title] of menuGroupItems)
            addItem(id, title);
    }
}

browser.contextMenus.onClicked.addListener(
    ({ menuItemId }, tab) => selectTabs(Getter[menuItemId], tab)
);
