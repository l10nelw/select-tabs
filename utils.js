// Remove text in parentheses and `&` character
export const cleanTitle = title => title.split(' (')[0].replace('&', '');
