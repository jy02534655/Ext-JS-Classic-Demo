/**
 * Rule describing a PivotTable selection.
 *
 * (CT_PivotArea)
 * @private
 */
Ext.define('Ext.exporter.file.ooxml.excel.PivotArea', {
    extend: 'Ext.exporter.file.ooxml.Base',

    requires: [
        'Ext.exporter.file.ooxml.excel.PivotAreaReference'
    ],

    config: {
        /**
         * @cfg {Boolean} [axis]
         *
         * The region of the PivotTable to which this rule applies.
         *
         * Possible values:
         *
         * - `axisCol` (Column Axis): Column axis
         * - `axisPage` (Include Count Filter): Page axis
         * - `axisRow` (Row Axis): Row axis
         * - `axisValues` (Values Axis): Values axis
         */
        axis: null,
        /**
         * @cfg {Boolean} [cacheIndex]
         *
         * Flag indicating whether any indexes refer to fields or items in the Pivot cache and not the view.
         */
        cacheIndex: null,
        /**
         * @cfg {Boolean} [collapsedLevelsAreSubtotals]
         *
         * Flag indicating if collapsed levels/dimensions are considered subtotals.
         */
        collapsedLevelsAreSubtotals: null,
        /**
         * @cfg {Boolean} [dataOnly]
         *
         * Flag indicating whether only the data values (in the data area of the view) for an item selection
         * are selected and does not include the item labels.
         */
        dataOnly: null,
        /**
         * @cfg {Number} [field]
         *
         * Index of the field that this selection rule refers to.
         */
        field: null,
        /**
         * @cfg {Number} [fieldPosition]
         *
         * Position of the field within the axis to which this rule applies.
         */
        fieldPosition: null,
        /**
         * @cfg {Boolean} [grandCol]
         *
         * Flag indicating whether the column grand total is included.
         */
        grandCol: null,
        /**
         * @cfg {Boolean} [grandRow]
         *
         * Flag indicating whether the row grand total is included.
         */
        grandRow: null,
        /**
         * @cfg {Boolean} [labelOnly]
         *
         * Flag indicating whether only the item labels for an item selection are selected and does
         * not include the data values (in the data area of the view).
         */
        labelOnly: null,
        /**
         * @cfg {String} [offset]
         *
         * A Reference that specifies a subset of the selection area. Points are relative to the
         * top left of the selection area.
         *
         * A reference identifies a cell or a range of cells on a worksheet and tells the application
         * where to look for the values or data you want to use in a formula. With references, you can
         * use data contained in different parts of a worksheet in one formula or use the value from one
         * cell in several formulas. You can also refer to cells on other sheets in the same workbook,
         * and to other workbooks. References to cells in other workbooks are called links.
         */
        offset: null,
        /**
         * @cfg {Boolean} [outline]
         *
         * Flag indicating whether the rule refers to an area that is in outline mode.
         */
        outline: null,
        /**
         * @cfg {String} [type]
         *
         * Indicates the type of selection rule.
         *
         * Possible values:
         *
         *  - `all` (All): Refers to the whole PivotTable.
         *  - `button` (Field Button): Refers to a field button.
         *  - `data` (Data): Refers to something in the data area.
         *  - `none` (None): Refers to no Pivot area.
         *  - `normal` (Normal): Refers to a header or item.
         *  - `origin` (Origin): Refers to the blank cells at the top-left of the PivotTable
         *  (top-left to LTR sheets, top-right for RTL sheets).
         *  - `topEnd` (Top End): Refers to the blank cells at the top of the PivotTable, on its
         *  trailing edge (top-right for LTR sheets, top-left for RTL sheets).
         */
        type: null,


        /**
         * @cfg {Ext.exporter.file.ooxml.excel.PivotAreaReference[]} references
         */
        references: null
    },

    tplNonAttributes: [
        'references'
    ],

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
        '<pivotArea {attributes}>',
        '<tpl if="references"><references count="{references.length}"><tpl for="references.getRange()">{[values.render()]}</tpl></references></tpl>',
        '</pivotArea>'
    ],

    applyReferences: function(data, dataCollection){
        return this.checkCollection(data, dataCollection, 'Ext.exporter.file.ooxml.excel.PivotAreaReference');
    }


});