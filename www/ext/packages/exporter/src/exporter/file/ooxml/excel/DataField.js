/**
 * Represents a field from a source list, table, or database that contains data
 * that is summarized in a PivotTable.
 *
 * (CT_DataField)
 * @private
 */
Ext.define('Ext.exporter.file.ooxml.excel.DataField', {
    extend: 'Ext.exporter.file.ooxml.Base',

    config: {
        /**
         * @cfg {Number} [baseField]
         *
         * Specifies the index to the base field when the ShowDataAs calculation is in use.
         */
        baseField: null,
        /**
         * @cfg {Number} [baseItem]
         *
         * Specifies the index to the base item when the ShowDataAs calculation is in use.
         */
        //baseItem: 1048832,
        baseItem: null,
        /**
         * @cfg {Number} fld (required)
         *
         * Specifies the index to the field (<r>) in the pivotCacheRecords part that this data item summarizes.
         */
        fld: null,
        /**
         * @cfg {String} [name]
         *
         * Specifies the name of the data field.
         */
        name: null,
        /**
         * @cfg {Number} [numFmtId]
         *
         * Specifies the index to the number format applied to this data field. Number formats are written
         * to the styles part. See the Styles section(§18.8) for more information on number formats.
         *
         * Formatting information provided by cell table and by PivotTable need not agree. If the two formats
         * differ, the cell-level formatting takes precedence. If you change the layout of
         * the PivotTable, the PivotTable formatting will then take precedence.
         */
        numFmtId: null,
        /**
         * @cfg {String} [showDataAs]
         *
         * Specifies the display format for this data field.
         * Formatting information provided by cell table and by PivotTable need not agree. If the two
         * formats differ, the cell-level formatting takes precedence. If you change the layout of the PivotTable,
         * the PivotTable formatting will then take precedence.
         *
         * Possible values:
         *
         *  - `difference` (Difference): Indicates the field is shown as the "difference from" a value.
         *  - `index` (Index): Indicates the field is shown as the "index.
         *  - `normal` (Normal Data Type): Indicates that the field is shown as its normal data type.
         *  - `percent` (Percentage Of): Indicates the field is show as the "percentage of
         *  - `percentDiff` (Percentage Difference): Indicates the field is shown as the "percentage difference
         *  from" a value.
         *  - `percentOfCol` (Percent of Column): Indicates the field is shown as the percentage of column.
         *  - `percentOfRow` (Percentage of Row): Indicates the field is shown as the percentage of row
         *  - `percentOfTotal` (Percentage of Total): Indicates the field is shown as percentage of total.
         *  - `runTotal` (Running Total): Indicates the field is shown as running total in the table.
         */
        showDataAs: null,
        /**
         * @cfg {String} [subtotal]
         *
         * Specifies the aggregation function that applies to this data field.
         *
         * Possible values:
         *
         *  - `average (Average): The average of the values.
         *  - `count (Count): The number of data values. The Count consolidation function works the same as
         *  the COUNTA worksheet function.
         *  - `countNums (CountNums): The number of data values that are numbers. The Count Nums consolidation
         *  function works the same as the COUNT worksheet function.
         *  - `max (Maximum): The largest value.
         *  - `min (Minimum): The smallest value.
         *  - `product (Product): The product of the values.
         *  - `stdDev (StdDev): An estimate of the standard deviation of a population, where the sample is a
         *  subset of the entire population.
         *  - `stdDevp (StdDevP): The standard deviation of a population, where the population is all of the
         *  data to be summarized.
         *  - `sum (Sum): The sum of the values.
         *  - `var (Variance): An estimate of the variance of a population, where the sample is a subset of
         *  the entire population.
         *  - `varp (VarP): The variance of a population, where the population is all of the data to be
         *  summarized.
         */
        subtotal: null
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
        '<dataField {attributes}/>'
    ]

});