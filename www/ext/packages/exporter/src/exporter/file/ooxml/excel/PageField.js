/**
 * Represents a field on the page or report filter of the PivotTable.
 *
 * [CT_PageField]
 * @private
 */
Ext.define('Ext.exporter.file.ooxml.excel.PageField', {
    extend: 'Ext.exporter.file.ooxml.Base',

    config: {
        /**
         * @cfg {String} [cap]
         *
         * Specifies the display name of the hierarchy.
         */
        cap: null,
        /**
         * @cfg {Number} fld (required)
         *
         * Specifies the index of the field that appears on the page or filter report area of the PivotTable.
         */
        fld: null,
        /**
         * @cfg {Number} [hier]
         *
         * Specifies the index of the OLAP hierarchy to which this item belongs.
         */
        hier: null,
        /**
         * @cfg {Number} [item]
         *
         * Specifies the index of the item in the PivotCache.
         */
        item: null,
        /**
         * @cfg {String} [name]
         *
         * Specifies the unique name of the hierarchy.
         */
        name: null
    },

    /**
     * @cfg generateTplAttributes
     * @inheritdoc Ext.exporter.file.ooxml.Base#property!generateTplAttributes
     * @localdoc
     *
     * **Note** Do not rename the config names that are part of the `attributes` since they are
     * mapped to the xml attributes needed by the template.
     */
    generateTplAttributes: true,

    tpl: [
        '<pageField {attributes} />'
    ]

});