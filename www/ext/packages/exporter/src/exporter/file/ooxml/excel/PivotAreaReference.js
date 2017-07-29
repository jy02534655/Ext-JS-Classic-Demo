/**
 * Represents a set of selected fields and selected items within those fields.
 *
 * (CT_PivotAreaReference)
 * @private
 */
Ext.define('Ext.exporter.file.ooxml.excel.PivotAreaReference', {
    extend: 'Ext.exporter.file.ooxml.Base',

    config: {
        /**
         * @cfg {Boolean} [avgSubtotal]
         *
         * Specifies a boolean value that indicates whether the 'average' aggregate function is
         * included in the filter.
         *
         * A value of 1 or true indicates the average aggregation function is included in the filter.
         *
         * A value of 0 or false indicates another aggregation function is included in the filter.
         */
        avgSubtotal: null,
        /**
         * @cfg {Boolean} [byPosition]
         *
         * Specifies a boolean value that indicates whether the item is referred to by position
         * rather than item index.
         *
         * A value of 1 or true indicates the item is referred to by position.
         *
         * A value of 0 or false indicates the item is referred to by index.
         */
        byPosition: null,
        /**
         * @cfg {Number} [count]
         *
         * Specifies the number of item indexes in the collection of indexes (x tags).
         */
        count: null,
        /**
         * @cfg {Boolean} [countASubtotal]
         *
         * Specifies a boolean value that indicates whether the 'countA' subtotal is
         * included in the filter.
         *
         * A value of 1 or true indicates the count aggregation function is included in the filter.
         *
         * A value of 0 or false indicates another aggregation function is included in the filter.
         */
        countASubtotal: null,
        /**
         * @cfg {Boolean} [countSubtotal]
         *
         * Specifies a boolean value that indicates whether the count aggregate function is included
         * in the filter.
         *
         * A value of 1 or true indicates the count aggregation function is included in the filter.
         *
         * A value of 0 or false indicates another aggregation function is included in the filter.
         */
        countSubtotal: null,
        /**
         * @cfg {Boolean} [defaultSubtotal]
         *
         * Specifies a boolean value that indicates whether the default subtotal is included in the filter.
         *
         * A value of 1 or true indicates the default subtotal is included in the filter. The default is to
         * display the total or the grand total.
         *
         * A value of 0 or false indicates another subtotal or aggregation function is included in the filter.
         */
        defaultSubtotal: null,
        /**
         * @cfg {Number} [field]
         *
         * Specifies the index of the field to which this filter refers. A value of -2 indicates
         * the 'data' field.
         */
        field: null,
        /**
         * @cfg {Boolean} [maxSubtotal]
         *
         * Specifies a boolean value that indicates whether the 'maximum' aggregate function is
         * included in the filter.
         *
         * A value of 1 or true indicates the maximum aggregation function is included in the filter.
         *
         * A value of 0 or false indicates another aggregation function is included in the filter.
         */
        maxSubtotal: null,
        /**
         * @cfg {Boolean} [minSubtotal]
         *
         * Specifies a boolean value that indicates whether the 'minimum' aggregate function is
         * included in the filter.
         *
         * A value of 1 or true indicates the minimum aggregation function is included in the filter.
         *
         * A value of 0 or false indicates another aggregation function is included in the filter.
         */
        minSubtotal: null,
        /**
         * @cfg {Boolean} [productSubtotal]
         *
         * Specifies a boolean value that indicates whether the 'product' aggregate function is
         * included in the filter.
         *
         * A value of 1 or true indicates the product aggregation function is included in the filter.
         *
         * A value of 0 or false indicates another aggregation function is included in the filter.
         */
        productSubtotal: null,
        /**
         * @cfg {Boolean} [relative]
         *
         * Specifies a boolean value that indicates whether the item is referred to by a relative reference
         * rather than an absolute reference. This attribute is used if posRef is set to true.
         *
         * A value of 1 or true indicates the item is referred to by a relative reference.
         *
         * A value of 0 or false indicates the item is referred to by an absolute reference.
         */
        relative: null,
        /**
         * @cfg {Boolean} [selected]
         *
         * Specifies a boolean value that indicates whether this field has selection. This attribute is
         * used when the PivotTable is in Outline view. It is also used when both header and data cells
         * have selection.
         *
         * A value of 1 or true indicates the field has selection.
         *
         * A value of 0 or false indicates the field does not have selection.
         */
        selected: null,
        /**
         * @cfg {Boolean} [stdDevPSubtotal]
         *
         * Specifies a boolean value that indicates whether the population standard deviation aggregate
         * function is included in the filter.
         *
         * A value of 1 or true indicates the population standard deviation aggregation function is
         * included in the filter.
         *
         * A value of 0 or false indicates another aggregation function is included in the filter.
         */
        stdDevPSubtotal: null,
        /**
         * @cfg {Boolean} [stdDevSubtotal]
         *
         * Specifies a boolean value that indicates whether the standard deviation aggregate function
         * is included in the filter.
         *
         * A value of 1 or true indicates the standard deviation aggregation function is included in
         * the filter.
         *
         * A value of 0 or false indicates another aggregation function is included in the filter.
         */
        stdDevSubtotal: null,
        /**
         * @cfg {Boolean} [sumSubtotal]
         *
         * Specifies a boolean value that indicates whether the sum aggregate function is included
         * in the filter.
         *
         * A value of 1 or true indicates the sum aggregation function is included in the filter.
         *
         * A value of 0 or false indicates another aggregation function is included in the filter.
         */
        sumSubtotal: null,
        /**
         * @cfg {Boolean} [varPSubtotal]
         *
         * Specifies a boolean value that indicates whether the population variance aggregate function
         * is included in the filter.
         *
         * A value of 1 or true indicates the population variance aggregation function is included
         * in the filter.
         *
         * A value of 0 or false indicates another aggregation function is included in the filter.
         */
        varPSubtotal: null,
        /**
         * @cfg {Boolean} [varSubtotal]
         *
         * Specifies a boolean value that indicates whether the variance aggregate function is included
         * in the filter.
         *
         * A value of 1 or true indicates the variance aggregation function is included in the filter.
         *
         * A value of 0 or false indicates another aggregation function is included in the filter.
         */
        varSubtotal: null,
        /**
         * @cfg {Number[]} [items]
         *
         * Selected items within the selected fields.
         */
        items: []
    },

    tplNonAttributes: [
        'items'
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
        '<reference {attributes}>',
        '<tpl if="items"><tpl for="items"><x v="{.}"/></tpl></tpl>',
        '</reference>'
    ],

    getCount: function(){
        return this.getItems().length;
    },

    applyItems: function(items){
        return items !== null ? Ext.Array.from(items) : null;
    }
});