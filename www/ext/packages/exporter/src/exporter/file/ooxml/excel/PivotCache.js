/**
 * This element represents a cache of data for pivot tables and formulas in the workbook.
 *
 * (CT_PivotCache)
 * @private
 */
Ext.define('Ext.exporter.file.ooxml.excel.PivotCache', {
    extend: 'Ext.exporter.file.ooxml.Base',

    config: {
        id: null,
        cacheId: null
    },

    autoGenerateId: false,

    tpl: [
        '<pivotCache cacheId="{cacheId}" r:id="{id}"/>'
    ]

});