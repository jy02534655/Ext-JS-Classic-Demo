/**
 * @private
 */
Ext.define('Ext.exporter.file.ooxml.excel.Column', {
    extend: 'Ext.exporter.file.ooxml.Base',

    config: {
        min: 1,
        max: 1,
        width: 10,
        autoFitWidth: false,
        hidden: false,
        styleId: null
    },

    tpl: [
        '<col ',
        'min="{min}" ',
        'max="{max}" ',
        'width="{width}"',
        '<tpl if="styleId"> style="{styleId}"</tpl>',
        '<tpl if="hidden"> hidden="1"</tpl>',
        '<tpl if="autoFitWidth"> bestFit="1"</tpl>',
        '<tpl if="width != 10"> customWidth="1"</tpl>',
        '/>'
    ]

});