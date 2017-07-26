/**
 * @private
 */
Ext.define('Ext.exporter.file.ooxml.excel.CellStyleXf', {
    extend: 'Ext.exporter.file.ooxml.Base',

    requires: [
        'Ext.exporter.file.ooxml.excel.CellAlignment'
    ],

    config: {
        numFmtId: 0,
        fontId: 0,
        fillId: 0,
        borderId: 0,
        alignment: null
    },

    autoGenerateKey: ['numFmtId', 'fontId', 'fillId', 'borderId', 'alignment'],

    tpl: [
        '<xf numFmtId="{numFmtId}" fontId="{fontId}" fillId="{fillId}" borderId="{borderId}"',
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

    applyAlignment: function(align){
        if(align && !align.isCellAlignment){
            return new Ext.exporter.file.ooxml.excel.CellAlignment(align);
        }
        return align;
    }
});