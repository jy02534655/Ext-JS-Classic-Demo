/**
 * @private
 */
Ext.define('Ext.d3.svg.Export', {

    singleton: true,

    /**
     * @private
     */
    toSvg: function (dom) {
        return '<?xml version="1.0" standalone="yes"?>' + this.serializeNode(dom);
    },

    /**
     * @private
     */
    download: function (filename, content) {
        var blob = new Blob([content]),
            a = document.createElement('a');

        a.setAttribute('download', filename);
        a.setAttribute('href', URL.createObjectURL(blob));

        a.click();
    },

    quotesRe: /"/g,

    /**
     * @private
     * Serializes an SVG DOM element and its children recursively into a string.
     * @param {Object} node DOM element to serialize.
     * @return {String}
     */
    serializeNode: function (node) {
        var result = '',
            i, n, attr, child, style, rule, value;

        if (node.nodeType === document.TEXT_NODE) {
            return this.escapeText(node.nodeValue);
        }

        // <node>
        result += '<' + node.nodeName;
        // <attributes>
        if (node.attributes.length) {
            for (i = 0, n = node.attributes.length; i < n; i++) {
                attr = node.attributes[i];
                if (attr.name !== 'style') { // will come from computed style below
                    result += ' ' + attr.name + '="' + attr.value + '"';
                }
            }
        }
        // </attributes>
        // <styles>
        style = getComputedStyle(node);
        result += ' style="';
        for (i = 0, n = style.length; i < n; i++) {
            rule = style[i];
            value = style[rule];
            if (typeof value === 'string') {
                result += rule + ':' + value.replace(this.quotesRe, '\'') + ';'
            }
        }
        result += '"';
        // </styles>
        result += '>';

        if (node.childNodes && node.childNodes.length) {
            for (i = 0, n = node.childNodes.length; i < n; i++) {
                child = node.childNodes[i];
                result += this.serializeNode(child);
            }
        }
        result += '</' + node.nodeName + '>';
        // </node>

        return result;
    },

    escapeTextRe: [
        [/&/g, '&amp;'], // have to replace all '&' first!
        [/"/g, '&quot;'],
        [/'/g, '&apos;'],
        [/</g, '&lt;'],
        [/>/g, '&gt;']
    ],

    /**
     * @private
     */
    escapeText: function (text) {
        var list = this.escapeTextRe,
            ln = list.length,
            i, item;

        for (i = 0; i < ln; i++) {
            item = list[i];
            text = text.replace(item[0], item[1]);
        }
        return text;
    }

});