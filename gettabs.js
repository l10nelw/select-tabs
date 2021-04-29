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
    return (await queryTabs()).slice(0, tab.index + 1);
}

export async function right(tab) {
    return (await queryTabs()).slice(tab.index);
}

export function sameSite(tab) {
    const host = (new URL(tab.url)).hostname;
    if (host) return queryTabs({ url: `*://${host}/*` });
}

    for (const tab of tabs) {
        tabs.push(...await descendants(tab));
    }
    return tabs;
export async function sameSite__descendants(tab) {
    const tabs = await sameSite(tab);
}

export async function sameSite__cluster(tab) {
    // A sameSite cluster contains tabs that are neighbours of the target tab and each other
    const tabs = await sameSite(tab);
    const tabIndex = tab.index;
    const arrayIndex = tabs.findIndex(tab => tab.index === tabIndex);
    const difference = tabIndex - arrayIndex;
    return tabs.filter((tab, i) => i + difference === tab.index); // Cluster tabs share the same difference between tab and query-array indexes
}

const getTab = id => browser.tabs.get(id);
const queryTabs = critieria => browser.tabs.query({ ...critieria, currentWindow: true });