/**
 * Represent information on style applied to the PivotTable.
 *
 * (CT_PivotTableStyleInfo)
 * @private
 */
Ext.define('Ext.exporter.file.ooxml.excel.PivotTableStyleInfo', {
    extend: 'Ext.exporter.file.ooxml.Base',

    config: {
        /**
         * @cfg {String} name
         *
         * Specifies the name of the table style to use with this table.
         *
         * The following style names are predefined:
         * - `PivotStyleLight1` -> `PivotStyleLight28`
         * - `PivotStyleMedium1` -> `PivotStyleMedium28`
         * - `PivotStyleDark1` -> `PivotStyleDark28`
         *
         * Annex G of the file c061750_ISO_IEC_29500-1_2012.pdf contains a listing of the supported PivotTable
         * styles and a sample workbook with each of those styles applied.*
         */
        name: 'PivotStyleLight2',
        /**
         * @cfg {Boolean} [showColHeaders]
         *
         * Specifies a boolean value that indicates whether to show column headers for the table.
         *
         * A value of 1 or true indicates column headers are shown.
         *
         * A value of 0 or false indicates column headers are omitted.
         *
         * 'True' if table style column header formatting should be displayed.
         */
        showColHeaders: true,
        /**
         * @cfg {Boolean} [showColStripes]
         *
         * Specifies a boolean value that indicates whether to show column stripe formatting for the table.
         *
         * A value of 1 or true indicates column stripe formatting is shown.
         *
         * A value of 0 or false indicates no column formatting is shown.
         *
         * True if table style column stripe formatting should be displayed.
         */
        showColStripes: null,
        /**
         * @cfg {Boolean} [showLastColumn]
         *
         * Specifies a boolean value that indicates whether to show the last column.
         */
        showLastColumn: true,
        /**
         * @cfg {Boolean} [showRowHeaders]
         *
         * Specifies a boolean value that indicates whether to show row headers for the table.
         *
         * A value of 1 or true indicates table style formatting is displayed.
         *
         * A value of 0 or false indicates table style formatting will not be displayed.
         */
        showRowHeaders: true,
        /**
         * @cfg {Boolean} [showRowStripes]
         *
         * Specifies a boolean value that indicates whether to show row stripe formatting for the table.
         *
         * A value of 1 or true indicates row stripe formatting is displayed.
         *
         * A value of 0 or false indicates no row formatting is shown.
         */
        showRowStripes: null
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
        '<pivotTableStyleInfo {attributes}/>'
    ]

});