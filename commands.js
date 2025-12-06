/*
To add a command:
- manifest.json
    - If command is shortcut-able, add entry in "commands" object: `<commandId>: { description }`. `description` format is "<category>: <title>".
        - If command has alternate title for vertical tabs, `description` format is "<category>: <title> | <alt title>".
- commands.js (this file)
    - Mandatory: Add command entry: typically `<commandId>: { parentId, contexts: ['tab'] }`.
    - If command has no manifest.json entry, include `category` and `title` properties. Alternate title for vertical tabs not supported.
    - Add command's default user-definable properties `showInTabMenu` and `accessKey`.
- get.js
    - Mandatory: Add command implementation.
- select.js
    - If applicable, add command to PIN_AGNOSTIC_COMMANDS.
*/

import { APP_NAME, MENU_ROOT as parentId } from '../common.js';

/** @import { CommandDict } from './common.js' */

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

    // Text Search
    matchLinkText: {
        parentId, contexts: ['link'],
        category: 'Text Search', title: `Link Text in Title or URL`,
        accessKey: 't',
    },
    matchSelectionText: {
        parentId, contexts: ['selection'],
        category: 'Text Search', title: `Selected Text in Title or URL`,
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

    // Tab Tree
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
        showInTabMenu: true, accessKey: 'f',
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
    past5Minutes: {
        parentId, contexts: ['tab'],
        showInTabMenu: true, accessKey: '5',
    },
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
    previous: { // Undo
        parentId, contexts: ['tab'],
        showInTabMenu: true, accessKey: 'z',
    },

    // Switch in Selection
    switchToHere: {
        parentId, contexts: ['tab'],
        category: 'Switch in Selection', title: `Switch to Here`,
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
