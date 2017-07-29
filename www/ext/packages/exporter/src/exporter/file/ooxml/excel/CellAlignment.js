/**
 * @private
 */
Ext.define('Ext.exporter.file.ooxml.excel.CellAlignment', {
    extend: 'Ext.exporter.file.ooxml.Base',

    isCellAlignment: true,

    config: {
        /**
         * @cfg {String} horizontal
         * Possible values:
         * - general
         * - left
         * - center
         * - right
         * - fill
         * - justify
         * - centerContinuous
         * - distributed
         */
        horizontal: 'general',

        /**
         * @cfg {String} vertical
         * Possible values:
         * - top
         * - center
         * - bottom
         * - justify
         * - distributed
         */
        vertical: 'top',
        
        rotate: null,
        wrapText: false,
        indent: null,
        relativeIndent: null,
        justifyLastLine: false,
        shrinkToFit: false,

        /**
         * @cfg {Number} readingOrder
         * An integer value indicating whether the reading order (bidirectionality) of the cell is
         * left- to-right, right-to-left, or context dependent.
         *
         * 0 - Context Dependent - reading order is determined by scanning the text for the first
         * non-whitespace character: if it is a strong right-to-left character, the reading order
         * is right-to-left; otherwise, the reading order left-to-right.
         * 1 - Left-to-Right- reading order is left-to-right in the cell, as in English.
         * 2 - Right-to-Left - reading order is right-to-left in the cell, as in Hebrew.
         *
         * The possible values for this attribute are defined by the W3C XML Schema unsignedInt datatype.
         */
        readingOrder: null
    },

    autoGenerateKey: [
        'horizontal', 'vertical', 'rotate', 'wrapText', 'indent',
        'relativeIndent', 'justifyLastLine', 'shrinkToFit', 'readingOrder'
    ],

    mappings: {
        horizontal: {
            Automatic: 'general',
            CenterAcrossSelection: 'centerContinuous',
            JustifyDistributed: 'distributed'
        },
        vertical: {
            Automatic: 'top',
            JustifyDistributed: 'distributed'
        },
        readingOrder: {
            Context: 0,
            LeftToRight: 1,
            RightToLeft: 2
        }
    },

    tpl: [
        '<alignment',
        '<tpl if="horizontal"> horizontal="{horizontal}"</tpl>',
        '<tpl if="vertical"> vertical="{vertical}"</tpl>',
        '<tpl if="rotate"> textRotation="{rotate}"</tpl>',
        '<tpl if="wrapText"> wrapText="{wrapText}"</tpl>',
        '<tpl if="indent"> indent="{indent}"</tpl>',
        '<tpl if="relativeIndent"> relativeIndent="{relativeIndent}"</tpl>',
        '<tpl if="justifyLastLine"> justifyLastLine="{justifyLastLine}"</tpl>',
        '<tpl if="shrinkToFit"> shrinkToFit="{shrinkToFit}"</tpl>',
        '<tpl if="readingOrder"> readingOrder="{readingOrder}"</tpl>',
        '/>'
    ],

    constructor: function(config){
        var cfg = {},
            keys = Ext.Object.getKeys(config || {}),
            len = keys.length,
            i;

        if(config) {
            for (i = 0; i < len; i++) {
                cfg[Ext.String.uncapitalize(keys[i])] = config[keys[i]];
            }
        }

        this.callParent([cfg]);
    },

    applyHorizontal: function(value){
        var possible = ['general', 'left', 'center', 'right', 'fill', 'justify', 'centerContinuous', 'distributed'],
            v = Ext.util.Format.uncapitalize(value);

        return Ext.Array.indexOf(possible, v) >= 0 ? v : (this.mappings.horizontal[value] || 'general');
    },

    applyVertical: function(value){
        var possible = ['top', 'center', 'bottom', 'justify', 'distributed'],
            v = Ext.util.Format.uncapitalize(value);

        return Ext.Array.indexOf(possible, v) >= 0 ? v : (this.mappings.vertical[value] || 'top');
    },

    applyReadingOrder: function(value){
        if(typeof value === 'string'){
            return this.mappings.readingOrder[value] || 0;
        }
        return value;
    }
});
