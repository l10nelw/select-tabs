/** @import { CommandInfo, CommandDict } from '../common.js' */

/** @type {HTMLSelectElement} */ const $commandList = document.getElementById('commandList');
/** @type {HTMLFormElement} */ const $form = $commandList.form;

init();
$form.addEventListener('submit', onSubmit);

/**
 * Load all popup-eligible commands and populate $commandList.
 */
async function init() {
    /**
     * @param {CommandInfo} commandInfo
     * @returns {boolean}
     */
    const isEligible = commandInfo => commandInfo.contexts.at(-1) === 'popup';

    /**
     * @param {string} label
     * @returns {HTMLOptGroupElement}
     */
    const insertOptionGroup = label => {
        const $optionGroup = document.createElement('optgroup');
        $optionGroup.label = label;
        $commandList.appendChild($optionGroup);
        return $optionGroup;
    };

    /** @type {{ commands: CommandDict }} */
    const { commands: commandDict } = await browser.storage.session.get('commands');

    /** @type {Map<string, HTMLOptGroupElement>} */
    const categoryMap = new Map();

    for (const commandId in commandDict) {
        /** @type {CommandInfo} */
        const commandInfo = commandDict[commandId];
        if (!isEligible(commandInfo))
            continue;
        const { category, title } = commandInfo;

        const $option = document.createElement('option');
        $option.value = commandId;
        $option.textContent = title;

        /** @type {HTMLOptGroupElement} */
        const $optionGroup = categoryMap.getOrInsertComputed(category, insertOptionGroup);
        $optionGroup.appendChild($option);
    }

    $commandList.focus();
}

/**
 * @param {SubmitEvent} event
 */
function onSubmit(event) {
    event.preventDefault(); // Don't reload popup
    browser.runtime.sendMessage({ type: 'selectTabs', commandId: $commandList.value });
}

