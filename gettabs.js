export async function parent(tab) {
    const { openerTabId } = tab;
    if (openerTabId) return [await getTab(openerTabId)];
}

export async function parent__descendants(tab) {
    const { openerTabId } = tab;
    return openerTabId ? (await Promise.all([ getTab(openerTabId), descendants(openerTabId) ])).flat()
        : target__descendants(tab);
}

export async function siblings(tab) {
    const { openerTabId } = tab;
    return openerTabId ? queryTabs({ openerTabId }) // If target tab has parent, get all tabs with same parent
        : (await queryTabs()).filter(tab => !tab.openerTabId); // Else, get all parentless tabs
}

export function siblings__descendants(tab) {
    return descendants(tab.openerTabId);
}

export async function target__descendants(tab) {
    return [tab, ...await descendants(tab)];
}

export async function descendants(tab_or_tabId) {
    const tabId = tab_or_tabId?.id || tab_or_tabId;
    const tabs = await queryTabs({ openerTabId: tabId });
    for (const tab of tabs) {
        tabs.push(...await descendants(tab));
    }
    return tabs;
}

export async function left(tab) {
    const tabs = (await queryTabs()).slice(0, tab.index);
    const last = tabs.length - 1;
    [ tabs[0], tabs[last] ] = [ tabs[last], tabs[0] ]; // Activate tab adjacent to target to avoid any scrolling to the start
    return tabs;
}

export async function right(tab) {
    return (await queryTabs()).slice(tab.index + 1);
}

export function sameHost(tab) {
    const host = (new URL(tab.url)).hostname;
    if (host) return queryTabs({ url: `*://${host}/*` });
}

export async function sameHost__descendants(tab) {
    const tabs = await sameHost(tab);
    for (const tab of tabs) {
        tabs.push(...await descendants(tab));
    }
    return tabs;
}

}

const getTab = id => browser.tabs.get(id);
const queryTabs = critieria => browser.tabs.query({ ...critieria, currentWindow: true });