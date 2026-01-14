(async () => {
    const items = Zotero.getActiveZoteroPane().getSelectedItems();
    
    if (!items.length) {
        return "Please, select the item";
    }

const minorWords = new Set([
        'a', 'an', 'and', 'as', 'at', 'but', 'by', 'en', 'for', 'if', 'in', 'nor', 'of', 'on', 'or', 'per', 'the', 'to', 'v', 'vs', 'via',
        'o', 'a', 'os', 'as', 'um', 'uma', 'uns', 'umas', 'de', 'do', 'da', 'dos', 'das', 'em', 'no', 'na', 'nos', 'nas', 'e', 'com', 'por', 'para', 'sob', 'sobre',
        'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'del', 'y', 'al', 'con',
        'der', 'die', 'das', 'ein', 'eine', 'einer', 'eines', 'einem', 'einen', 'und', 'oder', 'bei', 'mit', 'von', 'zu', 'an', 'auf', 'für'
    ]);

    let count = 0;

    for (let item of items) {
        if (!item.isRegularItem()) continue;

        let oldTitle = item.getField('title');
        if (!oldTitle) continue;


        let words = oldTitle.split(/\s+/);
        
        let newTitle = words.map((word, index) => {
            let cleanWord = word.replace(/^[\p{P}]+|[\p{P}]+$/gu, '').toLowerCase();

            if (index === 0 || index === words.length - 1) {
                return capitalize(word);
            }

            let prevWord = words[index - 1];
            if (prevWord && (prevWord.endsWith(':') || prevWord.endsWith('.'))) {
                return capitalize(word);
            }

            if (/[A-Z]/.test(word.slice(1))) {
                return word;
            }

            if (minorWords.has(cleanWord)) {
                return word.toLowerCase();
            }

            return capitalize(word);
        }).join(' ');

        if (oldTitle !== newTitle) {
            item.setField('title', newTitle);
            await item.saveTx();
            count++;
        }
    }

    return `Ready. ${count} updated items.`;

   
    function capitalize(str) {
        if (!str) return str;
        if (/[A-Z]/.test(str.slice(1))) return str;
        
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }
})();
