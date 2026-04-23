(async () => {
    const items = Zotero.getActiveZoteroPane().getSelectedItems();
    
    if (!items.length) {
        return "Processo abortado. Item não selecionado.";
    }

    const minorWords = new Set([
        'a', 'an', 'and', 'as', 'at', 'but', 'by', 'en', 'for', 'if', 'in', 'nor', 'of', 'on', 'or', 'per', 'the', 'to', 'v', 'vs', 'via',
        'o', 'a', 'os', 'as', 'um', 'uma', 'uns', 'umas', 'de', 'do', 'da', 'dos', 'das', 'em', 'no', 'na', 'nos', 'nas', 'e', 'com', 'por', 'para', 'sob', 'sobre',
        'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'del', 'y', 'al', 'con',
        'der', 'die', 'das', 'ein', 'eine', 'einer', 'eines', 'einem', 'einen', 'und', 'oder', 'bei', 'mit', 'von', 'zu', 'an', 'auf', 'für',
        'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'et', 'ou', 'pour', 'en', 'au', 'aux', 'sur', 'sous', 'dans', 'avec', 'sans', 'par'
    ]);

    let count = 0;

    function cleanString(str) {
        if (!str) return str;
        
        str = str.replace(/<[^>]+>/g, '');
        
        str = str.replace(/\\[a-zA-Z]+\s*\{([^}]*)\}/g, '$1');
        str = str.replace(/\\[a-zA-Z]+\s*/g, '');
        str = str.replace(/[{}]/g, ''); 
        
        str = str.replace(/^[•\-*–—>\s]+/g, '');
        str = str.replace(/^(?!(?:1[5-9]|20)\d{2}\b)(?:\d+(?:\.\d+)*[\.\)]?\s+)+/g, '');
        str = str.replace(/^(?:[IVXLCDM]+[\.\)]\s+)+/i, '');
        str = str.replace(/^[•\-*–—>\s]+/g, '');
        
        str = str.replace(/(?:`\s*`|'\s*'|`\s*'|'\s*`)/g, '"'); 
        str = str.replace(/<<|>>|,,|“|”|«|»|„|"/g, '"');
        str = str.replace(/‘|’|‚|`/g, "'");

        str = str.replace(/(^|\s)"\s+/g, '$1"');
        str = str.replace(/\s+"($|[\s.,;:!?\-])/g, '"$1');
        
        str = str.replace(/(^|\s)'\s+/g, "$1'");
        str = str.replace(/\s+'($|[\s.,;:!?\-])/g, "'$1");

        str = str.replace(/(^|[\s\(\[-])"/g, '$1``');
        str = str.replace(/"/g, "''");
        
        str = str.replace(/(^|[\s\(\[-])'/g, '$1`');
        
        str = str.replace(/\s+/g, ' ').trim();
        
        return str;
    }

    function capitalize(str) {
        if (!str) return str;
        const match = str.match(/^([^\p{L}]*)(\p{L})(.*)$/u);
        if (!match) return str;
        
        const prefix = match[1];
        const char = match[2];
        const rest = match[3];

        if (/[A-Z]/.test(rest)) return str;
        
        return prefix + char.toUpperCase() + rest.toLowerCase();
    }

    for (let item of items) {
        if (!item.isRegularItem()) continue;

        let oldTitle = item.getField('title');
        let oldShortTitle = item.getField('shortTitle');

        let updateRequired = false;

        if (oldTitle) {
            let cleanedTitle = cleanString(oldTitle);
            let words = cleanedTitle.split(/\s+/);
            let newTitle = words.map((word, index) => {
                let cleanWord = word.replace(/^[\p{P}]+|[\p{P}]+$/gu, '').toLowerCase();

                if (index === 0 || index === words.length - 1) {
                    return capitalize(word);
                }

                let prevWord = words[index - 1];
                if (prevWord && (prevWord.endsWith(':') || prevWord.endsWith('.') || prevWord.endsWith('?'))) {
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
                updateRequired = true;
            }
        }

        if (oldShortTitle) {
            let cleanedShortTitle = cleanString(oldShortTitle);
            let wordsShort = cleanedShortTitle.split(/\s+/);
            let newShortTitle = wordsShort.map((word, index) => {
                let cleanWord = word.replace(/^[\p{P}]+|[\p{P}]+$/gu, '').toLowerCase();

                if (index === 0 || index === wordsShort.length - 1) {
                    return capitalize(word);
                }

                let prevWord = wordsShort[index - 1];
                if (prevWord && (prevWord.endsWith(':') || prevWord.endsWith('.') || prevWord.endsWith('?'))) {
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

            if (oldShortTitle !== newShortTitle) {
                item.setField('shortTitle', newShortTitle);
                updateRequired = true;
            }
        }

        if (updateRequired) {
            await item.saveTx();
            count++;
        }
    }

    return `Processamento concluído. ${count} artefatos modificados.`;
})();
