/*
 * Tab-getting functions a.k.a. commands.
 * Most require at least a target tab argument, some do not.
 * Returns either an array of tabs to be selected, or falsy (to abort selection).
 */

/** @import { MenuClickInfo, Tab } from '../common.js' */

/**
 * @callback NonNull_Getter
 * @param {Tab} targetTab
 * @param {Tab[]} preSelection
 * @param {MenuClickInfo} [menuClickInfo]
 * @returns {Promise<Tab[]>}
 */
/**
 * @callback CanNull_Getter
 * @param {Tab} targetTab
 * @param {Tab[]} preSelection
 * @param {MenuClickInfo} [menuClickInfo]
 * @returns {Promise<Tab[]?>}
 */

/**
 * @param {object.<string, any>} properties
 * @returns {Promise<Tab[]>}
 */
const get = properties => browser.tabs.query({ currentWindow: true, ...properties });

/**
 * Explicitly indicate the tab to switch to among the tabs to select.
 * If the tab is not among the tabs to select, it will increase the selection set by that one tab.
 * @param {Tab[]} tabsToSelect
 * @param {Tab} tabToActivate
 * @returns {Tab[]}
 * @modifies tabsToSelect
 * @modifies tabToActivate
 */
function setActiveTab(tabsToSelect, tabToActivate) {
    tabToActivate.active = true;
    if (tabToActivate.id !== tabsToSelect[0].id)
        tabsToSelect.unshift(tabToActivate); // browser.tabs.highlight() will activate the first tab in array
    return tabsToSelect;
}


/* --- Text search commands --- */

/** @type {CanNull_Getter} */ export const matchLinkText = (_, __, { linkText }) => matchText(linkText);
/** @type {CanNull_Getter} */ export const matchSelectionText = (_, __, { selectionText }) => matchText(selectionText);

/**
 * @param {string} text
 * @returns {Promise<Tab[]?>}
 */
async function matchText(text) {
    text = text.trim().toLowerCase();
    if (!text)
        return;
    /**
     * @param {Tab} tab
     * @returns {boolean}
     */
    const isMatch = tab => {
        // Check title
        if (tab.title.toLowerCase().includes(text))
            return true;
        // Check url
        if (text.includes(' ')) // TODO: Should we check for more characters?
            return false;
        let url = tab.url.toLowerCase();
        if (url.startsWith(READER_HEAD))
            url = getReaderUrl(url);
        return url.includes(text);
    }
    return (await get()).filter(isMatch);
}


/* --- URL-based commands --- */

/** @type {CanNull_Getter} */
export async function duplicates({ url, isInReaderMode }) {
    if (isInReaderMode)
        url = getReaderUrl(url);
    const { protocol, hostname, pathname, search } = new URL(url); // Ignore port and hash; they are not queryable
    url = (protocol === 'about:') ?
        protocol + pathname :
        `${protocol}//${hostname}${pathname}${search}`;
    const tabs = await get({ url });
    if (tabs.length > 1)
        return tabs;
}

/** @type {NonNull_Getter} */
export async function sameSite({ url, isInReaderMode }) {
    if (isInReaderMode)
        url = getReaderUrl(url);
    const { protocol, hostname } = new URL(url);
    if (protocol === 'file:')
        return get({ url: 'file:///*' });
    if (protocol === 'moz-extension:')
        return get({ url: `moz-extension://${hostname}/*` });
    if (hostname)
        return (await Promise.all([
            get({ url: `*://${hostname}/*` }),
            getReaderTabsByHostname(hostname),
        ])).flat();
    return (await get({ url: `${protocol}*` })).filter(tab => !tab.isInReaderMode);
}

/** @type {NonNull_Getter} */
export const sameSite__cluster = async targetTab => getCluster(await sameSite(targetTab), targetTab);

/** @type {NonNull_Getter} */
export async function sameSite__descendants(targetTab) {
    const tabs = await sameSite(targetTab);
    const descendantTabs = (await Promise.all( tabs.map(getDescendants) )).flat();
    return tabs.concat(descendantTabs);
}

const READER_HEAD = 'about:reader?url=';
/**
 * @param {string} url
 * @returns {string}
 */
const getReaderUrl = url => decodeURIComponent(url.slice(READER_HEAD.length));
/**
 * @param {string} url
 * @returns {string}
 */
const getHostname = url => (new URL(url)).hostname;
/**
 * @param {string} hostname
 * @returns {Promise<Tab[]>}
 */
const getReaderTabsByHostname = async hostname =>
    (await get({ url: `${READER_HEAD}*` }))
    .filter(tab => getHostname(getReaderUrl(tab.url)) === hostname);


/* --- Directional commands --- */

/** @type {NonNull_Getter} */ export const toStart = async ({ index }) => (await get()).slice(0, index + 1);
/** @type {NonNull_Getter} */ export const toEnd = async ({ index }) => (await get()).slice(index);

/** @type {CanNull_Getter} */
export async function addLeft(_, preSelection) {
    const firstTabIndex = preSelection[0].index;
    if (firstTabIndex !== 0)
        return preSelection.concat({ index: firstTabIndex - 1 });
}

/** @type {CanNull_Getter} */
export async function addRight(_, preSelection) {
    const tabToAdd = await getByIndex(preSelection.at(-1).index + 1);
    if (tabToAdd)
        return preSelection.concat({ index: tabToAdd.index });
}

/** @type {CanNull_Getter} */
export async function trailLeft(_, preSelection) {
    const tabsToSelect = [...preSelection];
    const activeTabArrayIndex = tabsToSelect.findIndex(tab => tab.active);
    const activeTab = tabsToSelect[activeTabArrayIndex];
    const activeTabIndex = activeTab.index;
    if (activeTabIndex === 0)
        return;
    const rightTab = await getByIndex(activeTabIndex + 1);
    const leftTabIndex = activeTabIndex - 1;
    const leftTab = tabsToSelect.find(tab => tab.index === leftTabIndex) || { index: leftTabIndex };
    if (leftTab.highlighted && !rightTab?.highlighted)
        tabsToSelect.splice(activeTabArrayIndex, 1); // Shrink trail by removing activeTab from selection
    return setActiveTab(tabsToSelect, leftTab); // Activate leftTab; Adds to selection if not already included, which expands trail
}

/** @type {CanNull_Getter} */
export async function trailRight(_, preSelection) {
    const tabsToSelect = [...preSelection];
    const activeTabArrayIndex = tabsToSelect.findIndex(tab => tab.active);
    const activeTab = tabsToSelect[activeTabArrayIndex];
    const activeTabIndex = activeTab.index;
    const rightTab = await getByIndex(activeTabIndex + 1);
    if (!rightTab)
        return;
    const leftTabIndex = activeTabIndex - 1;
    const leftTab = leftTabIndex >= 0 && tabsToSelect.find(tab => tab.index === leftTabIndex);
    if (rightTab.highlighted && !leftTab?.highlighted)
        tabsToSelect.splice(activeTabArrayIndex, 1); // Shrink trail by removing activeTab from selection
    return setActiveTab(tabsToSelect, rightTab); // Activate rightTab; Adds to selection if not already included, which expands trail
}

/**
 * @param {number} index
 * @returns {Promise<Tab?>}
 */
const getByIndex = async index => (await get({ index }).catch(() => null))?.[0];


/* --- Tab-tree commands --- */

/** @type {CanNull_Getter} */
export async function descendants(targetTab) {
    const descendantTabs = await getDescendants(targetTab);
    if (descendantTabs.length)
        return descendantTabs.concat(targetTab);
}

/** @type {CanNull_Getter} */
export async function parent({ openerTabId }) {
    if (openerTabId)
        return [await getById(openerTabId)];
}

/** @type {CanNull_Getter} */
export async function parent__descendants(targetTab) {
    const { openerTabId } = targetTab;
    if (openerTabId) {
        const [parentTab, familyTabs] = await Promise.all([ getById(openerTabId), getDescendants(openerTabId) ]);
        return familyTabs.concat(parentTab);
    }
    return descendants(targetTab);
}

/** @type {NonNull_Getter} */
export async function siblings({ openerTabId }) {
    return openerTabId ?
        getChildrenOfId(openerTabId) : // If target tab has parent, get all tabs with same parent
        (await get()).filter(tab => !tab.openerTabId); // Else, get all parentless tabs
}

/** @type {NonNull_Getter} */
export function siblings__descendants({ openerTabId }) {
    return openerTabId ?
        getDescendants(openerTabId) :
        get();
}

/**
 * @param {Tab | number} tab_or_tabId
 * @returns {Promise<Tab[]>}
 */
async function getDescendants(tab_or_tabId) {
    const tabId = tab_or_tabId?.id || tab_or_tabId;
    const childTabs = await getChildrenOfId(tabId);
    const descendantTabs = (await Promise.all( childTabs.map(getDescendants) )).flat();
    return childTabs.concat(descendantTabs);
}

/**
 * @param {number} tabId
 * @returns {Promise<Tab>}
 */
const getById = tabId => browser.tabs.get(tabId);
/**
 * @param {number} openerTabId
 * @returns {Promise<Tab[]>}
 */
const getChildrenOfId = openerTabId => get({ openerTabId });


/* --- Membership commands --- */

/** @type {CanNull_Getter} */ export const sameTabGroup = ({ groupId }) => (groupId !== -1) && get({ groupId });
/** @type {CanNull_Getter} */ export const sameContainer = ({ cookieStoreId }) => isContainerId(cookieStoreId) && get({ cookieStoreId });

const NON_CONTAINER_IDS = ['firefox-default', 'firefox-private'];
const isContainerId = cookieStoreId => !NON_CONTAINER_IDS.includes(cookieStoreId);


/* --- Temporal commands --- */

const MINUTE = 1000 * 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;

/** @type {NonNull_Getter} */ export const past5Minutes = () => getTabsAccessedWithinPeriod(MINUTE * 5);
/** @type {NonNull_Getter} */ export const pastHour = () => getTabsAccessedWithinPeriod(HOUR);
/** @type {NonNull_Getter} */ export const past24Hours = () => getTabsAccessedWithinPeriod(DAY);
/** @type {NonNull_Getter} */ export const today = () => getTabsAccessedOnDay(0);
/** @type {CanNull_Getter} */ export const yesterday = () => getTabsAccessedOnDay(-1);

/**
 * @param {number} period
 * @returns {Promise<Tab[]>}
 */
async function getTabsAccessedWithinPeriod(period) {
    const now = Date.now();
    return (await get()).filter(tab => (now - tab.lastAccessed) <= period);
}

/**
 * @param {number} offset
 * @returns {Promise<Tab[]>}
 */
async function getTabsAccessedOnDay(offset) {
    const date = new Date();
    if (offset)
        date.setDate(date.getDate() + offset);
    const day = date.getDate();
    const month = date.getMonth();
    const year = date.getFullYear();
    /**
     * @param {Tab} tab
     * @returns {boolean}
     */
    const isLastAccessedAtDate = tab => {
        const tabDate = new Date(tab.lastAccessed);
        return tabDate.getDate() === day && tabDate.getMonth() === month && tabDate.getFullYear() === year;
    };
    return (await get()).filter(isLastAccessedAtDate);
}


/* --- Selection commands --- */

/** @type {NonNull_Getter} */ export const all = () => get();
/** @type {NonNull_Getter} */ export const active = () => get({ active: true }); // "Clear"
/** @type {NonNull_Getter} */ export const unselected = () => get({ highlighted: false }); // "Invert"
/** @type {NonNull_Getter} */ export const cluster = async (targetTab, preSelection) => getCluster(preSelection, targetTab);
/** @type {CanNull_Getter} */ export const previous = async () => (await browser.storage.session.get('preSelection')).preSelection; // "Undo"

/**
 * Given an array of tabs that may have continuity gaps in their indexes, return only the subarray of consecutive indexes that the targetTab is part of.
 * Meaning, return the bunch of tabs around the targetTab that must be adjacent to each other.
 * @param {Tab[]} tabs
 * @param {Tab} targetTab
 * @returns {Tab[]}
 */
function getCluster(tabs, targetTab) {
    const targetTabIndex = targetTab.index;
    const targetArrayIndex = tabs.findIndex(tab => tab.index === targetTabIndex);
    const difference = targetTabIndex - targetArrayIndex;
    return tabs.filter(
        /**
         * Cluster tabs share same difference between tab and tabs-array indexes.
         * @param {Tab} tab
         * @param {number} arrayIndex
         * @returns {boolean}
         */
        (tab, arrayIndex) => tab.index === (arrayIndex + difference)
    );
}


/* --- Switch in Selection commands --- */

/** @type {NonNull_Getter} */ export const switchToHere = (targetTab, preSelection) => setActiveTab(preSelection, targetTab);
/** @type {NonNull_Getter} */ export const cycleForward = (_, preSelection) => cycleInSelection(preSelection, 1);
/** @type {NonNull_Getter} */ export const cycleBackward = (_, preSelection) => cycleInSelection(preSelection, -1);

/**
 * @param {Tab[]} preSelection
 * @param {number} offset
 * @returns {Promise<Tab[]>}
 */
async function cycleInSelection(preSelection, offset) {
    const activeTabArrayIndex = preSelection.findIndex(tab => tab.active);
    const tab = preSelection.at(activeTabArrayIndex + offset) ?? preSelection[0];
    return setActiveTab(preSelection, tab);
}
