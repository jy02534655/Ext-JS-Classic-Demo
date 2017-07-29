/**
 * This class is used to create an xml Excel Table
 */
Ext.define('Ext.exporter.file.excel.Table', {
    extend: 'Ext.exporter.file.Base',

    config: {
        /**
         * This attribute specifies the total number of columns in this table. If specified, this attribute
         * must be in sync with the table. Columns indices in the table should begin at 1 and go to
         * ExpandedColumnCount. If this value is out-of-sync with the table, the specified XML Spreadsheet
         * document is invalid.
         *
         * @private
         */
        expandedColumnCount: null,
        /**
         * Specifies the total number of rows in this table without regard for sparseness. This attribute defines
         * the overall size of the table, if the specified rows and columns were expanded to full size.
         * If specified, this attribute must be in sync with the table. Row indices in the table should begin
         * at 1 and go to ExpandedRowCount. If this value is out-of-sync with the table, the specified XML
         * Spreadsheet document is invalid.
         *
         * @private
         */
        expandedRowCount: null,
        /**
         * WebCalc will set x:FullColumns to 1 when the data in the table represents full columns of data.
         * Excel will save x:FullColumns to 1 if the Table extends the full height. This attribute is ignored
         * on file load, but on XML Spreadsheet paste it is taken to indicate that the source clip has full columns.
         *
         * @private
         */
        fullColumns: 1,
        /**
         * WebCalc will set x:FullRows to 1 when the data in the table represents full rows of data. Excel will
         * save x:FullRows to 1 if the Table extends the full width. This attribute is ignored on file load, but on
         * XML Spreadsheet paste it is taken to indicate that the source clip has full rows.
         *
         * @private
         */
        fullRows: 1,
        /**
         * @cfg {Number} [defaultColumnWidth=48]
         *
         * Specifies the default width of columns in this table. This attribute is specified in points.
         */
        defaultColumnWidth: 48,
        /**
         * @cfg {Number} [defaultRowHeight=12.75]
         *
         * Specifies the default height of rows in this table. This attribute is specified in points.
         */
        defaultRowHeight: 12.75,
        /**
         * @cfg {String} styleId
         *
         * Excel style attached to this table
         */
        styleId: null,
        /**
         * @cfg {Number} [leftCell=1]
         *
         * Specifies the column index that this table should be placed at. This value must be greater than zero.
         */
        leftCell: 1,
        /**
         * @cfg {Number} [topCell=1]
         *
         * Specifies the row index that this table should be placed at. This value must be greater than zero.
         */
        topCell: 1,
        /**
         * @cfg {Ext.exporter.file.excel.Column[]} columns
         *
         * Collection of column definitions available on this table
         */
        columns: [],
        /**
         * @cfg {Ext.exporter.file.excel.Row[]} rows
         *
         * Collection of row definitions available on this table
         */
        rows: []
    },

    /**
     * @method getColumns
     * @return {Ext.util.Collection}
     *
     * Returns the collection of columns available in this table
     */

    /**
     * @method getRows
     * @return {Ext.util.Collection}
     *
     * Returns the collection of rows available in this table
     */

    tpl: [
        '       <Table x:FullColumns="{fullColumns}" x:FullRows="{fullRows}"',
        '<tpl if="this.exists(expandedRowCount)"> ss:ExpandedRowCount="{expandedRowCount}"</tpl>',
        '<tpl if="this.exists(expandedColumnCount)"> ss:ExpandedColumnCount="{expandedColumnCount}"</tpl>',
        '<tpl if="this.exists(defaultRowHeight)"> ss:DefaultRowHeight="{defaultRowHeight}"</tpl>',
        '<tpl if="this.exists(defaultColumnWidth)"> ss:DefaultColumnWidth="{defaultColumnWidth}"</tpl>',
        '<tpl if="this.exists(leftCell)"> ss:LeftCell="{leftCell}"</tpl>',
        '<tpl if="this.exists(topCell)"> ss:TopCell="{topCell}"</tpl>',
        '<tpl if="this.exists(styleId)"> ss:StyleID="{styleId}"</tpl>',
        '>\n',
        '<tpl if="columns"><tpl for="columns.getRange()">{[values.render()]}</tpl></tpl>',
        '<tpl if="rows">',
        '<tpl for="rows.getRange()">{[values.render()]}</tpl>',
        '<tpl else>         <Row ss:AutoFitHeight="0"/>\n</tpl>',
        '       </Table>\n',
        {
            exists: function(value){
                return !Ext.isEmpty(value);
            }
        }
    ],

    destroy: function() {
        this.setColumns(null);
        this.setRows(null);
        this.callParent();
    },

    applyColumns: function(data, dataCollection){
        return this.checkCollection(data, dataCollection, 'Ext.exporter.file.excel.Column');
    },

    applyRows: function(data, dataCollection){
        return this.checkCollection(data, dataCollection, 'Ext.exporter.file.excel.Row');
    },

    /**
     * Convenience method to add columns. You can also use workbook.getColumns().add(config).
     * @param {Object/Array} config
     * @return {Ext.exporter.file.excel.Column/Ext.exporter.file.excel.Column[]}
     */
    addColumn: function(config){
        return this.getColumns().add(config || {});
    },

    /**
     * Convenience method to fetch a column by its id.
     * @param id
     * @return {Ext.exporter.file.excel.Column}
     */
    getColumn: function(id){
        return this.getColumns().get(id);
    },

    /**
     * Convenience method to add rows. You can also use workbook.getRows().add(config).
     * @param {Object/Array} config
     * @return {Ext.exporter.file.excel.Row/Ext.exporter.file.excel.Row[]}
     */
    addRow: function(config){
        return this.getRows().add(config || {});
    },

    /**
     * Convenience method to fetch a row by its id.
     * @param id
     * @return {Ext.exporter.file.excel.Row}
     */
    getRow: function(id){
        return this.getRows().get(id);
    }

});
