/*
To add a command:
- manifest.json
    - If command is shortcut-able, add entry in "commands" object. `description` format is "<category>: <title>".
        - If command has alternate title for vertical tabs, `description` format is "<category>: <title> | <alt title>".
- commands.js (this file)
    - Mandatory: Add command's base properties as entry in BASE_DICT.
    - If command has no manifest.json entry, include `category` and `title` properties.
    - If command has alternate title for vertical tabs, `title` format is "<title> | <alt title>".
    - Add command's default user-definable properties `showInTabMenu` and `accessKey`.
- get.js
    - Mandatory: Add command implementation.
- select.js
    - Add command's `includePinned` condition if required.
*/

import { APP_NAME, MENU_ROOT as parentId } from '../common.js';

/** @typedef {import('./common.js').CommandDict} CommandDict */

/**
 * Base dict of commands. For each entry (a CommandInfo):
 * - `parentId` (except for the parentId entry itself) and `contexts` are required.
 * - `category` and `title` will be derived from manifest.json if available, otherwise they should be defined here.
 * - `showInTabMenu` and `accessKey` are user-set properties, containing default values.
 * @type {CommandDict}
 */
export default {

    [parentId]: {
        contexts: ['tab', 'link', 'selection'],
        title: APP_NAME,
        accessKey: 's',
    },

    // Text search
    matchLinkText: {
        parentId, contexts: ['link'],
        category: 'Text search', title: `Link Text in Title or URL`,
        accessKey: 't',
    },
    matchSelectionText: {
        parentId, contexts: ['selection'],
        category: 'Text search', title: `Selected Text in Title or URL`,
        accessKey: 't',
    },

    // URL-based
    duplicates: {
        parentId, contexts: ['tab', 'link'],
        showInTabMenu: true, accessKey: 'u',
    },
    sameSite: {
        parentId, contexts: ['tab', 'link'],
        showInTabMenu: true, accessKey: 's',
    },
    sameSite__cluster: {
        parentId, contexts: ['tab'],
        showInTabMenu: true, accessKey: 's',
    },
    sameSite__descendants: {
        parentId, contexts: ['tab'],
        showInTabMenu: true, accessKey: 'm',
    },

    // Tab tree
    descendants: {
        parentId, contexts: ['tab'],
        showInTabMenu: true, accessKey: 'd',
    },
    parent: {
        parentId, contexts: ['tab'],
        showInTabMenu: true, accessKey: 'p',
    },
    parent__descendants: {
        parentId, contexts: ['tab'],
        showInTabMenu: true, accessKey: 'n',
    },
    siblings: {
        parentId, contexts: ['tab'],
        showInTabMenu: false,
    },
    siblings__descendants: {
        parentId, contexts: ['tab'],
        showInTabMenu: false,
    },

    // Membership
    sameTabGroup: {
        parentId, contexts: ['tab'],
        showInTabMenu: true, accessKey: 'g',
    },
    sameContainer: {
        parentId, contexts: ['tab'],
        showInTabMenu: true, accessKey: 'c',
    },

    // Directional
    toStart: {
        parentId, contexts: ['tab'],
        showInTabMenu: true, accessKey: 'r',
    },
    toEnd: {
        parentId, contexts: ['tab'],
        showInTabMenu: true, accessKey: 'e',
    },
    addLeft: {
        parentId, contexts: ['tab'],
        showInTabMenu: false,
    },
    addRight: {
        parentId, contexts: ['tab'],
        showInTabMenu: false,
    },
    trailLeft: {
        parentId, contexts: ['tab'],
        showInTabMenu: false,
    },
    trailRight: {
        parentId, contexts: ['tab'],
        showInTabMenu: false,
    },

    // Temporal
    pastHour: {
        parentId, contexts: ['tab'],
        showInTabMenu: true, accessKey: '1',
    },
    past24Hours: {
        parentId, contexts: ['tab'],
        showInTabMenu: true, accessKey: '2',
    },
    today: {
        parentId, contexts: ['tab'],
        showInTabMenu: true, accessKey: 'o',
    },
    yesterday: {
        parentId, contexts: ['tab'],
        showInTabMenu: true, accessKey: 'y',
    },

    // Selection
    all: {
        parentId, contexts: ['tab'],
        showInTabMenu: true, accessKey: 'a',
    },
    active: { // Clear
        parentId, contexts: ['tab'],
        showInTabMenu: false,
    },
    unselected: { // Invert
        parentId, contexts: ['tab'],
        showInTabMenu: true, accessKey: 'v',
    },
    cluster: {
        parentId, contexts: ['tab'],
        showInTabMenu: true, accessKey: 'l',
    },

    // Switch within selection
    switchToHere: {
        parentId, contexts: ['tab'],
        category: 'Switch within selection', title: `Switch to Here`,
        showInTabMenu: true, accessKey: 'h',
    },
    cycleForward: {
        parentId, contexts: ['tab'],
        showInTabMenu: false,
    },
    cycleBackward: {
        parentId, contexts: ['tab'],
        showInTabMenu: false,
    },

}
