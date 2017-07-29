/**
 * @private
 */
Ext.define('Ext.exporter.file.ooxml.excel.Fill', {
    extend: 'Ext.exporter.file.ooxml.Base',

    requires: [
        'Ext.util.Format'
    ],

    config: {
        /**
         * @cfg {String} patternType
         * Possible values:
         * - none
         * - solid
         * - mediumGray
         * - darkGray
         * - lightGray
         * - darkHorizontal
         * - darkVertical
         * - darkDown
         * - darkUp
         * - darkGrid
         * - darkTrellis
         * - lightHorizontal
         * - lightVertical
         * - lightDown
         * - lightUp
         * - lightGrid
         * - lightTrellis
         * - gray125
         * - gray0625
         */
        patternType: 'none',
        
        fgColor: null,
        bgColor: null
    },

    tpl: [
        '<fill>',
        '<tpl if="fgColor || bgColor">',
        '<patternFill patternType="{patternType}">',
        '<tpl if="fgColor"><fgColor rgb="{fgColor}"></fgColor></tpl>',
        '<tpl if="bgColor"><bgColor rgb="{bgColor}"></bgColor></tpl>',
        '</patternFill>',
        '<tpl else>',
        '<patternFill patternType="{patternType}"/>',
        '</tpl>',
        '</fill>'
    ],

    autoGenerateKey: ['patternType', 'fgColor', 'bgColor'],

    constructor: function(config){
        var cfg = {};

        if(config) {
            cfg.id = config.id;
            cfg.bgColor = config.Color || null;
            cfg.patternType = config.Pattern || null;
        }

        this.callParent([cfg]);
    },

    formatColor: function(value){
        var v;

        if(!value){
            return value;
        }

        v = String(value);
        return v.indexOf('#') >= 0 ? v.replace('#', '') : v;
    },

    applyFgColor: function(value){
        return this.formatColor(value);
    },

    applyBgColor: function(value){
        return this.formatColor(value);
    },

    applyPatternType: function(value){
        var possible = ['none', 'solid', 'mediumGray', 'darkGray', 'lightGray', 'darkHorizontal', 'darkVertical',
                        'darkDown', 'darkUp', 'darkGrid', 'darkTrellis', 'lightHorizontal', 'lightVertical',
                        'lightDown', 'lightUp', 'lightGrid', 'lightTrellis', 'gray125', 'gray0625'],
            v = Ext.util.Format.uncapitalize(value);

        return Ext.Array.indexOf(possible, v) >= 0 ? v : 'none';
    }
});
