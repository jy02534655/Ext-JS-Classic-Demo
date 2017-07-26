/**
 * @private
 */
Ext.define('Ext.exporter.file.ooxml.excel.CellXf', {
    extend: 'Ext.exporter.file.ooxml.excel.CellStyleXf',

    config: {
        xfId: 0
    },

    tpl: [
        '<xf numFmtId="{numFmtId}" fontId="{fontId}" fillId="{fillId}" borderId="{borderId}" xfId="{xfId}"',
        '<tpl if="numFmtId"> applyNumberFormat="1"</tpl>',
        '<tpl if="fillId"> applyFill="1"</tpl>',
        '<tpl if="borderId"> applyBorder="1"</tpl>',
        '<tpl if="fontId"> applyFont="1"</tpl>',
        '<tpl if="alignment">',
        ' applyAlignment="1">{[values.alignment.render()]}</xf>',
        '<tpl else>',
        '/>',
        '</tpl>'
    ],

    autoGenerateKey: ['xfId']
});