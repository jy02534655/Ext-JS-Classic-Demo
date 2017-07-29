/**
 * (CT_Location)
 * @private
 */
Ext.define('Ext.exporter.file.ooxml.excel.Location', {
    extend: 'Ext.exporter.file.ooxml.Base',

    config: {
        /**
         * @cfg {String} ref (required)
         *
         * Specifies the first row of the PivotTable.
         */
        ref: null,
        /**
         * @cfg {Number} firstHeaderRow (required)
         *
         * Specifies the first row of the PivotTable header, relative to the top left cell in the ref value.
         */
        firstHeaderRow: null,
        /**
         * @cfg {Number} firstDataRow (required)
         *
         * Specifies the first row of the PivotTable data, relative to the top left cell in the ref value.
         */
        firstDataRow: null,
        /**
         * @cfg {Number} firstDataCol (required)
         *
         * Specifies the first column of the PivotTable data, relative to the top left cell in the ref value.
         */
        firstDataCol: null,
        /**
         * @cfg {Number} [rowPageCount]
         *
         * Specifies the number of rows per page for this PivotTable that the filter area will occupy.
         * By default there is a single column of filter fields per page and the fields occupy as many rows
         * as there are fields.
         */
        rowPageCount: null,
        /**
         * @cfg {Number} [colPageCount]
         *
         * Specifies the number of columns per page for this PivotTable that the filter area will occupy.
         * By default there is a single column of filter fields per page and the fields occupy as many rows
         * as there are fields.
         */
        colPageCount: null
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
        '<location {attributes}/>'
    ]

});