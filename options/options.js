import { isOS } from '../common.js';
import * as Commands from '../commands.js';

/** @typedef {import('../common.js').CommandId} CommandId */
/** @typedef {import('../common.js').CommandInfo} CommandInfo */
/** @typedef {import('../common.js').CommandDict} CommandDict */

/** @type {boolean} */ const SUPPORTS_ACCESSKEYS = !isOS('Mac OS');
/** @type {Element} */ const $form = document.body.querySelector('form');
/** @type {Element} */ const $tableBody = $form.querySelector('tbody');
populate();
$form.addEventListener('submit', onFormSubmit);
$form.addEventListener('input', onFormInput);
$form.addEventListener('focusin', onFormFocus);
$form.addEventListener('click', onFormClick);

async function populate() {
    /** @type {DocumentFragment} */ const $template = $form.querySelector('template').content;
    /** @type {Element} */ const $headingTemplate = $template.firstElementChild;
    /** @type {Element} */ const $rowTemplate = $template.lastElementChild;

    /** @type {[{ commands: CommandDict, shownTabMenuItems: Set<CommandId> }, Object[]]} */
    const [{ commands, shownTabMenuItems }, shortcutableCommands] = await Promise.all([ Commands.getData(), browser.commands.getAll() ]);

    for (const { name, shortcut } of shortcutableCommands)
        commands[name].shortcut = shortcut || '—';

    if (SUPPORTS_ACCESSKEYS) {
        commands.matchSelectionText.title = 'With Selected Text';
    } else {
        $form.querySelector('.accessKey')?.remove(); // In <thead>
        $headingTemplate.querySelector('.accessKey')?.remove();
        $rowTemplate.querySelector('.accessKey')?.remove();
        delete commands.menuRoot;
        delete commands.matchLinkText;
        delete commands.matchSelectionText;
    }

    /**
     * @param {string} id
     * @returns {string}
     */
    const accessKeyFieldLabel = id => `Access key for "${id}" command`;

    /**
     * @param {string} category
     * @returns {Element}
     */
    $tableBody.addHeading = category => {
        const $heading = $headingTemplate.cloneNode(true);
        $heading.firstElementChild.textContent = category;
        $tableBody.append($heading);
        return $heading;
    };

    /**
     * @param {CommandId} id
     * @param {string} title
     * @param {CommandInfo} info
     * @param {string} info.accessKey
     * @param {string} info.shortcut
     * @returns {Element}
     */
    $tableBody.addRow = (id, { accessKey, contexts, parentId, shortcut, title }) => {
        /** @type {boolean} */
        const isTabMenuItem = parentId && contexts.includes('tab');
        if (!isTabMenuItem && !SUPPORTS_ACCESSKEYS)
            return;
        /** @type {Element} */
        const $row = $rowTemplate.cloneNode(true);

        // title
        const $title = $row.querySelector('.title label');
        $title.textContent = title;
        $title.htmlFor = id;
        // showInTabMenu
        const $showInTabMenu = $row.querySelector('.showInTabMenu input');
        $showInTabMenu.id = id;
        $showInTabMenu.name = id;
        isTabMenuItem ?
            $showInTabMenu.checked = shownTabMenuItems.has(id) :
            $showInTabMenu.remove();
        // accessKey
        if (SUPPORTS_ACCESSKEYS) {
            const $accessKey = $row.querySelector('.accessKey input');
            $accessKey.name = id;
            $accessKey.value = accessKey;
            $accessKey.setAttribute('aria-label', accessKeyFieldLabel(title));
        }
        // shortcut
        if (shortcut)
            $row.querySelector('.shortcut').textContent = shortcut;

        $tableBody.append($row);
        return $row;
    };

    // Add rows for commands and categories
    let currentCategory = '';
    for (const [id, info] of Object.entries(commands)) {
        const { category = '' } = info;
        if (category !== currentCategory) {
            $tableBody.addHeading(category);
            currentCategory = category;
        }
        $tableBody.addRow(id, info);
    }
}

/**
 * @listens Event#click
 * @param {Event} event
 */
function onFormClick({ target }) {
    if (target.matches('.shortcut') && target.textContent)
        browser.commands.openShortcutSettings();
}

/**
 * @listens Event#focusin
 * @param {Event} event
 */
async function onFormFocus(event) {
    const $field = event.target;
    if ($field.matches('.accessKey input'))
        $field.select();
}

/**
 * @listens Event#input
 * @param {Event} event
 */
async function onFormInput(event) {
    const $field = event.target;
    if ($field.matches('.accessKey input'))
        $field.value = $field.value.toLowerCase();
}

/**
 * Save preferences.
 * @listens Event#submit
 * @param {Event} event
 */
async function onFormSubmit(event) {
    event.preventDefault();

    const shownTabMenuItems = [];
    for (const $input of $tableBody.querySelectorAll('.showInTabMenu input'))
        if ($input.checked)
            shownTabMenuItems.push($input.name);

    const accessKeys = {};
    for (const $input of $tableBody.querySelectorAll('.accessKey input'))
        if ($input.value)
            accessKeys[$input.name] = $input.value;

    await browser.storage.sync.set({ shownTabMenuItems, accessKeys });
    browser.runtime.reload();
}
