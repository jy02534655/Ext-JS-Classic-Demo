/**
 * This class is used to create an xml Excel Row
 */
Ext.define('Ext.exporter.file.excel.Row', {
    extend: 'Ext.exporter.file.Base',

    config: {
        /**
         * @cfg {Boolean} [autoFitHeight=false]
         *
         * Set this to 1 if you want to auto fit its height
         */
        autoFitHeight: false,
        /**
         * @cfg {String} caption
         *
         * Specifies the caption that should appear when the Component's custom row and column headers are showing.
         */
        caption: null,
        /**
         * @cfg {Ext.exporter.file.excel.Cell[]} cells
         *
         * Collection of cells available on this row.
         */
        cells: [],
        /**
         * @cfg {Number} height
         *
         * Row's height in the Excel table
         */
        height: null,
        /**
         * @cfg {String} index
         *
         * Index of this row in the Excel table
         */
        index: null,
        /**
         * @cfg {Number} span
         *
         * Specifies the number of adjacent rows with the same formatting as this row. When a Span attribute
         * is used, the spanned row elements are not written out.
         *
         * As mentioned in the index config, rows must not overlap. Doing so results in an XML Spreadsheet document
         * that is invalid. Care must be taken with this attribute to ensure that the span does not include another
         * row index that is specified.
         *
         * Unlike columns, rows with the Span attribute must be empty. A row that contains a Span attribute and
         * one or more Cell elements is considered invalid. The Span attribute for rows is a short-hand method
         * for setting formatting properties for multiple, empty rows.
         *
         */
        span: null,
        /**
         * @cfg {String} styleId
         *
         * Excel style attached to this row
         */
        styleId: null
    },

    /**
     * @method getCells
     * @return {Ext.util.Collection}
     *
     * Returns the collection of cells available in this row
     */

    tpl: [
        '           <Row',
            '<tpl if="this.exists(index)"> ss:Index="{index}"</tpl>',
            '<tpl if="this.exists(caption)"> c:Caption="{caption}"</tpl>',
            '<tpl if="this.exists(autoFitHeight)"> ss:AutoFitHeight="{autoFitHeight:this.toNumber}"</tpl>',
            '<tpl if="this.exists(span)"> ss:Span="{span}"</tpl>',
            '<tpl if="this.exists(height)"> ss:Height="{height}"</tpl>',
            '<tpl if="this.exists(styleId)"> ss:StyleID="{styleId}"</tpl>',
        '>\n',
        '<tpl if="cells"><tpl for="cells.getRange()">{[values.render()]}</tpl></tpl>',
        '           </Row>\n',
        {
            exists: function(value){
                return !Ext.isEmpty(value);
            },

            toNumber: function(value){
                return Number(Boolean(value));
            }
        }
    ],

    destroy: function() {
        this.setCells(null);
        this.callParent();
    },

    applyCells: function(data, dataCollection){
        return this.checkCollection(data, dataCollection, 'Ext.exporter.file.excel.Cell');
    },

    /**
     * Convenience method to add cells. You can also use workbook.getCells().add(config).
     * @param {Object/Array} config
     * @return {Ext.exporter.file.excel.Cell/Ext.exporter.file.excel.Cell[]}
     */
    addCell: function(config){
        return this.getCells().add(config || {});
    },

    /**
     * Convenience method to fetch a cell by its id.
     * @param id
     * @return {Ext.exporter.file.excel.Cell}
     */
    getCell: function(id){
        return this.getCells().get(id);
    }

});