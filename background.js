import * as GetTabs from './gettabs.js';

buildMenu({
	// function/menuItemId: title
	sameSite:               '&Same Site',
	sameSite__descendants:  'Sa&me Site and Descendants',
	sameSite__cluster:      'Same Site &Cluster',
	_0:                     '',
	left:                   'To the &Left',
	right:                  'To the &Right',
	_1:                     '',
	parent:                 '&Parent',
	parent__descendants:    'P&arent and Descendants',
	siblings:               'S&iblings',
	siblings__descendants:  'Si&blings and Descendants',
	descendants:            '&Descendants',
});

function buildMenu(menuItems) {
    const contexts = ['tab'];
	const parentId = 'selecttabs';
	
	browser.contextMenus.create({
		contexts,
		id: parentId,
		title: '&Select Tabs',
	});
	
    for (const [id, title] of Object.entries(menuItems)) {
		const isMenuItem = title.length;
		if (isMenuItem) {
			browser.contextMenus.create({
				contexts,
				parentId,
				title,
				onclick: (info, tab) => select(GetTabs[id], tab),				
			});
		}
		else {
			browser.contextMenus.create({
				contexts,
				parentId,
				type: 'separator',
			});
		}
    }
}

async function select(getter, targetTab) {
    const tabs = await getter(targetTab);
    if (!tabs?.length) return;
    const tabIndexes = activeTabFirst(tabs, targetTab).map(tab => tab.index);
    browser.tabs.highlight({ tabs: tabIndexes, populate: false });
}

// Move an already active tab or the targeted tab to the start of the tabs array, if either is available.
// Sets up array for tabs.highlight(), which activates the first tab in array.
function activeTabFirst(tabs, targetTab) {
    let activeTabIndex = tabs.findIndex(tab => tab.active);
    if (activeTabIndex === -1) {
        const { id } = targetTab;
        activeTabIndex = tabs.findIndex(tab => tab.id === id);
    }
    if (activeTabIndex > 0) {
        [ tabs[0], tabs[activeTabIndex] ] = [ tabs[activeTabIndex], tabs[0] ];
    }
    return tabs;
}
