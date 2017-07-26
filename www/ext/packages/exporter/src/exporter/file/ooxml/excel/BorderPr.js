/**
 * @private
 */
Ext.define('Ext.exporter.file.ooxml.excel.BorderPr', {
    extend: 'Ext.exporter.file.ooxml.Base',

    isBorderPr: true,

    config: {
        tag: 'left',
        color: null,

        /**
         * @cfg {String} lineStyle
         * Possible values:
         * - none
         * - thin
         * - medium
         * - dashed
         * - dotted
         * - thick
         * - double
         * - hair
         * - mediumDashed
         * - dashDot
         * - mediumDashDot
         * - dashDotDot
         * - mediumDashDotDot
         * - slantDashDot
         */
        lineStyle: 'none'
    },

    mappings: {
        lineStyle: {
            'None': 'none',
            'Continuous': 'thin',
            'Dash': 'dashed',
            'Dot': 'dotted',
            'DashDot': 'dashDot',
            'DashDotDot': 'dashDotDot',
            'SlantDashDot': 'slantDashDot',
            'Double': 'double'
        }
    },

    tpl: [
        '<tpl if="color">',
        '<{tag} style="{lineStyle}"><color rgb="{color}"/></{tag}>',
        '<tpl else>',
        '<{tag} style="{lineStyle}"/>',
        '</tpl>'
    ],

    autoGenerateKey: ['tag', 'color', 'lineStyle'],

    applyColor: function(value){
        var v;

        if(!value){
            return value;
        }

        v = String(value);
        return v.indexOf('#') >= 0 ? v.replace('#', '') : v;
    },

    applyLineStyle: function(value){
        var possible = ['none', 'thin', 'medium', 'dashed', 'dotted', 'thick', 'double', 'hair',
            'mediumDashed', 'dashDot', 'mediumDashDot', 'dashDotDot', 'mediumDashDotDot', 'slantDashDot'];

        return Ext.Array.indexOf(possible, value) >= 0 ? value : (this.mappings.lineStyle[value] || 'none');
    }
});
