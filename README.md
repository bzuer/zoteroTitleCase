# zoteroTitleCase
A .js script to Title Case titles on Zotero. 

**Select the items** > Tools > Developer > Run JavaScript 

```js
(async () => {
    "use strict";

    const items = Zotero.getActiveZoteroPane().getSelectedItems();

    if (!items.length) {
        return "Processo abortado. Nenhum item selecionado.";
    }

    // Palavras funcionais que permanecem minúsculas (exceto início/fim)
    const minorWords = new Set([
        // Inglês
        'a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'if', 'in', 'into',
        'nor', 'of', 'off', 'on', 'onto', 'or', 'over', 'per', 'the', 'to',
        'up', 'upon', 'v', 'via', 'vs', 'with', 'within', 'without',
        // Português
        'a', 'à', 'às', 'ao', 'aos', 'as', 'com', 'como', 'da', 'das', 'de',
        'do', 'dos', 'e', 'em', 'entre', 'na', 'nas', 'no', 'nos', 'num',
        'numa', 'o', 'os', 'ou', 'para', 'pela', 'pelas', 'pelo', 'pelos',
        'por', 'se', 'sem', 'sob', 'sobre', 'um', 'uma', 'uns', 'umas',
        // Espanhol
        'al', 'con', 'del', 'el', 'la', 'las', 'los', 'un', 'una', 'unas',
        'unos', 'y',
        // Alemão
        'an', 'auf', 'bei', 'das', 'der', 'die', 'ein', 'eine', 'einem',
        'einen', 'einer', 'eines', 'für', 'mit', 'oder', 'und', 'von', 'zu',
        // Francês
        'au', 'aux', 'avec', 'dans', 'de', 'des', 'du', 'en', 'et', 'la',
        'le', 'les', 'ou', 'par', 'pour', 'sans', 'sous', 'sur', 'un', 'une'
    ]);

    // Pontuação que, ao final da palavra anterior, força capitalização
    const PUNCT_FORCE_CAP = /[:.?!;—–]\s*$/;

    function cleanString(str) {
        if (!str) return str;

        // 1) Remove comandos LaTeX com chaves: \textit{foo} -> foo
        str = str.replace(/\\[a-zA-Z@]+\s*\{([^{}]*)\}/g, '$1');
        // 2) Remove comandos LaTeX sem chaves (preserva escapes \& \% \$ \_ \# \{ \})
        str = str.replace(/\\([&%$_#{}])/g, '$1'); // desescapa primeiro
        str = str.replace(/\\[a-zA-Z@]+\s*/g, '');   // remove \command restantes
        // 3) Remove chaves órfãs
        str = str.replace(/[{}]/g, '');
        // 4) Remove HTML/XML tags
        str = str.replace(/<[^>]+>/g, '');
        // 5) Remove marcadores de lista
        str = str.replace(/^[•\-*–—>\s]+/, '');
        // 6) Remove numeração inicial (1., 2.1., etc.) preservando anos 1500–2099
        str = str.replace(/^(?!(?:1[5-9]|20)\d{2}\b)(?:\d+(?:\.\d+)*[\.\)]?\s+)+/, '');
        // 7) Remove numeração romana inicial (I., II., ...)
        str = str.replace(/^(?:[IVXLCDM]+[\.\)]\s+)+/i, '');
        // 8) Remove marcadores remanescentes
        str = str.replace(/^[•\-*–—>\s]+/, '');
        // 9) Normaliza aspas e travessões
        str = str.replace(/[`'']+/g, '"');           // agrupa aspas simples/backtick -> aspas duplas
        str = str.replace(/[«»„“”"<<>>]/g, '"');
        str = str.replace(/[‘’‚`]/g, "'");
        // 10) Colapsa espaços
        str = str.replace(/\s+/g, ' ').trim();

        return str;
    }

    function capitalize(str) {
        if (!str) return str;
        // Preserva palavras com maiúsculas internas (ex.: iPhone, McDonald, NEWS)
        if (/[A-Z]/.test(str.slice(1))) return str;
        const match = str.match(/^([^\p{L}]*)(\p{L})(.*)$/u);
        if (!match) return str;
        return match[1] + match[2].toUpperCase() + match[3].toLowerCase();
    }

    function isMinor(word) {
        // Remove pontuação nas bordas para comparar
        const clean = word.replace(/^[\p{P}\p{S}]+|[\p{P}\p{S}]+$/gu, '').toLowerCase();
        return minorWords.has(clean);
    }

    function titleCase(str) {
        const words = str.split(/\s+/).filter(Boolean);
        if (!words.length) return str;

        return words.map((word, index) => {
            const isFirst = index === 0;
            const isLast  = index === words.length - 1;
            const prev    = words[index - 1] || '';

            // Palavras com maiúsculas internas são preservadas
            if (/[A-Z]/.test(word.slice(1))) return word;

            // Primeira/última palavra, ou após pontuação forte -> capitaliza
            if (isFirst || isLast || PUNCT_FORCE_CAP.test(prev)) {
                return capitalize(word);
            }

            // Palavras funcionais -> minúsculas
            if (isMinor(word)) return word.toLowerCase();

            return capitalize(word);
        }).join(' ');
    }

    let count = 0;
    const errors = [];

    for (const item of items) {
        if (!item.isRegularItem()) continue;

        try {
            let changed = false;

            for (const field of ['title', 'shortTitle']) {
                const oldVal = item.getField(field);
                if (!oldVal) continue;

                const newVal = titleCase(cleanString(oldVal));
                if (oldVal !== newVal) {
                    item.setField(field, newVal);
                    changed = true;
                }
            }

            if (changed) {
                await item.saveTx();
                count++;
            }
        } catch (e) {
            errors.push(`${item.getField('title') || item.id}: ${e.message}`);
        }
    }

    const msg = `Processamento concluído. ${count} artefato(s) modificado(s).`;
    return errors.length ? `${msg}\nErros (${errors.length}):\n${errors.join('\n')}` : msg;
})();
```
