/**
 * Tab-getting functions a.k.a. commands
 * (tab) => (tabs)
**/

const queryTabs = properties => browser.tabs.query({ currentWindow: true, ...properties });


/* URL-based commands */

export async function duplicate({ url, isInReaderMode }) {
    if (isInReaderMode)
        url = getReaderUrl(url);
    const { protocol, hostname, pathname, search } = new URL(url);
    url = `${protocol}//${hostname}${pathname}${search}`; // Url pattern cannot include port or hash
    return queryTabs({ url });
}

export async function sameSite({ url, isInReaderMode }) {
    if (isInReaderMode)
        url = getReaderUrl(url);
    const { protocol, hostname } = new URL(url);
    if (protocol === 'file:')
        return queryTabs({ url: 'file:///*' });
    if (protocol === 'moz-extension:')
        return queryTabs({ url: `moz-extension://${hostname}/*` });
    if (hostname)
        return (await Promise.all(
            [ queryTabs({ url: `*://${hostname}/*` }), getReaderTabsByHostname(hostname) ]
        )).flat();
    return queryTabs({ url: `${protocol}*` });
}

export async function sameSite__cluster(tab) {
    const tabs = await sameSite(tab);
    const targetTabIndex = tab.index;
    const targetArrayIndex = tabs.findIndex(tab => tab.index === targetTabIndex);
    const difference = targetTabIndex - targetArrayIndex;
    return tabs.filter(
        (tab, arrayIndex) => tab.index === arrayIndex + difference
    ); // Cluster tabs share same difference between tab and tabs-array indexes
}

export async function sameSite__descendants(tab) {
    const tabs = await sameSite(tab);
    const descendantTabs = (await Promise.all( tabs.map(getDescendantTabs) )).flat();
    return tabs.concat(descendantTabs);
}

const READER_HEAD = 'about:reader?url=';
const getReaderUrl = url => decodeURIComponent( url.slice(READER_HEAD.length) );
const getHostname = url => (new URL(url)).hostname;
const getReaderTabsByHostname = async hostname =>
    (await queryTabs({ url: `${READER_HEAD}*` }))
    .filter(tab => getHostname(getReaderUrl(tab.url)) === hostname);


/* Directional commands */

export async function left({ index }) {
    return (await queryTabs()).slice(0, index + 1);
}

export async function right({ index }) {
    return (await queryTabs()).slice(index);
}


/* Tab-tree commands */

export async function descendants(tab) {
    return [tab, ...await getDescendantTabs(tab)];
}

export async function parent({ openerTabId }) {
    return openerTabId ? [await getTab(openerTabId)]
        : [];
}

export async function parent__descendants(tab) {
    const { openerTabId } = tab;
    return openerTabId ? (await Promise.all([ getTab(openerTabId), getDescendantTabs(openerTabId) ])).flat()
        : descendants(tab);
}

export async function siblings({ openerTabId }) {
    return openerTabId ? getChildTabs(openerTabId) // If target tab has parent, get all tabs with same parent
        : (await queryTabs()).filter(tab => !tab.openerTabId); // Else, get all parentless tabs
}

export function siblings__descendants({ openerTabId }) {
    return openerTabId ? getDescendantTabs(openerTabId)
        : queryTabs();
}

async function getDescendantTabs(tab_or_tabId) {
    const tabId = tab_or_tabId?.id || tab_or_tabId;
    const childTabs = await getChildTabs(tabId);
    const descendantTabs = (await Promise.all( childTabs.map(getDescendantTabs) )).flat();
    return childTabs.concat(descendantTabs);
}

const getTab = id => browser.tabs.get(id);
const getChildTabs = openerTabId => queryTabs({ openerTabId });

