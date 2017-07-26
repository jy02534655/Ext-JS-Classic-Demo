/**
 * @private
 */
Ext.define('Ext.exporter.file.ooxml.excel.Font', {
    extend: 'Ext.exporter.file.ooxml.Base',

    config: {
        size: 10,
        fontName: '',
        family: null, // 1: Roman, 2: Swiss, 3: Modern, 4: Script, 5: Decorative
        charset: null,
        bold: false,
        italic: false,
        underline: false,
        outline: false,
        strikeThrough: false,
        color: null, // rgb color
        verticalAlign: null // `baseline`, `superscript`, `subscript`
    },

    mappings: {
        family: {
            Automatic: 0,
            Roman: 1,
            Swiss: 2,
            Modern: 3,
            Script: 4,
            Decorative: 5
        }
    },

    tpl: [
        '<font>',
        '<tpl if="size"><sz val="{size}"/></tpl>',
        '<tpl if="fontName"><name val="{fontName}"/></tpl>',
        '<tpl if="family"><family val="{family}"/></tpl>',
        '<tpl if="charset"><charset val="{charset}"/></tpl>',
        '<tpl if="bold"><b/></tpl>',
        '<tpl if="italic"><i/></tpl>',
        '<tpl if="underline"><u/></tpl>',
        '<tpl if="outline"><outline/></tpl>',
        '<tpl if="strikeThrough"><strike/></tpl>',
        '<tpl if="color"><color rgb="{color}"/></tpl>',
        '<tpl if="verticalAlign"><vertAlign val="{verticalAlign}"/></tpl>',
        '</font>'
    ],

    autoGenerateKey: [
        'size', 'fontName', 'family', 'charset', 'bold', 'italic',
        'underline', 'outline', 'strikeThrough', 'color', 'verticalAlign'
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

    applyFamily: function(value){
        if(typeof value === 'string'){
            return this.mappings.family[value];
        }
        return value;
    },

    applyBold: function (value) {
        return !!value;
    },

    applyItalic: function (value) {
        return !!value;
    },

    applyStrikeThrough: function (value) {
        return !!value;
    },

    applyUnderline: function (value) {
        return !!value;
    },

    applyOutline: function (value) {
        return !!value;
    },

    applyColor: function(value){
        var v;

        if(!value){
            return value;
        }

        v = String(value);
        return v.indexOf('#') >= 0 ? v.replace('#', '') : v;
    },

    applyVerticalAlign: function(value){
        return Ext.util.Format.lowercase(value);
    }
});