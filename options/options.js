import { getPreferenceDict, getCommandMap, cleanCommandDescription } from '../common.js';

(async function populateForm() {
    const preferenceDict = await getPreferenceDict();

    const $commands = document.getElementById('commands');
    const $template = $commands.querySelector('template').content;
    const template = {
        $heading: $template.firstElementChild,
        $checkField: $template.querySelector('label'),
    };
    $commands.addHeading = title => {
        const $heading = template.$heading.cloneNode();
        $heading.textContent = title;
        $commands.append($heading);
    };
    $commands.addField = (name, title, checked) => {
        const $field = template.$checkField.cloneNode(true);
        const $input = $field.querySelector('input');
        $input.name = name;
        $input.checked = checked;
        $field.querySelector('span').textContent = cleanCommandDescription(title);
        $commands.append($field);
    };

    let currentCategory = '';
    for (const [id, description] of getCommandMap()) {
        const [category, title] = description.split(': ');
        if (category !== currentCategory) {
            currentCategory = category;
            $commands.addHeading(category);
        }
        $commands.addField(id, title, preferenceDict[id]);
    }
})();

document.body.querySelector('form')
.addEventListener('submit', async event => {
    // Save and restart

    const preferenceDict = {};
    for (const $field of event.target.elements)
        if ($field.classList.contains('command'))
            preferenceDict[$field.name] = $field.checked;

    await browser.storage.sync.set(preferenceDict);
    browser.runtime.reload();
});