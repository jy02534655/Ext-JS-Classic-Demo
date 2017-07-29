/**
 * Represents the collection of items in the row region of the PivotTable.
 *
 * (CT_I)
 * @private
 */
Ext.define('Ext.exporter.file.ooxml.excel.Item', {
    extend: 'Ext.exporter.file.ooxml.Base',

    config: {
        /**
         * @cfg {Number} [i]
         *
         * Specifies a zero-based index indicating the referenced data item it in a data field
         * with multiple data items.
         */
        i: null,
        /**
         * @cfg {Number} [r]
         *
         * Specifies the number of items to repeat from the previous row item. The first item
         * has no @r explicitly written. Since a default of "0" is specified in the schema, for any
         * item whose @r is missing, a default value of "0" is implied.
         */
        r: null,
        /**
         * @cfg {Number} [t]
         *
         * Specifies the type of the item. Value of 'default' indicates a grand total as the
         * last row item value
         *
         * Possible values:
         *
         *  - `avg` (Average): Indicates the pivot item represents an "average" aggregate function.
         *  - `blank` (Blank Pivot Item): Indicates the pivot item represents a blank line.
         *  - `count` (Count): Indicates the pivot item represents custom the "count" aggregate."
         *  - `countA` (CountA): Indicates the pivot item represents the "count numbers" aggregate function.
         *  - `data` (Data): Indicate the pivot item represents data.
         *  - `default` (Default): Indicates the pivot item represents the default type for this PivotTable.
         *  The default pivot item type is the "total" aggregate function.
         *  - `grand` (Grand Total Item): Indicates the pivot items represents the grand total line.
         *  - `max` (Max): Indicates the pivot item represents the "maximum" aggregate function.
         *  - `min` (Min): Indicates the pivot item represents the "minimum" aggregate function.
         *  - `product` (Product): Indicates the pivot item represents the "product" function.
         *  - `stdDev` (stdDev): Indicates the pivot item represents the "standard deviation" aggregate function.
         *  - `stdDevP` (StdDevP): Indicates the pivot item represents the "standard deviation population" aggregate function.
         *  - `sum` (Sum): Indicates the pivot item represents the "sum" aggregate value.
         *  - `var` (Var): Indicates the pivot item represents the "variance" aggregate value.
         *  - `varP` (VarP): Indicates the pivot item represents the "variance population" aggregate value.
         */
        t: null,
        /**
         * @cfg {Number[]} [x]
         *
         * Represents an array of indexes to cached member property values.
         *
         * Each item specifies the index into the shared items table in the PivotCache that identifies this item.
         */
        x: null
    },

    tpl: [
        '<tpl if="x"><i{attr}>{x}</i><tpl else><i{attr}/></tpl>'
    ],

    getRenderData: function(){
        var data = this.callParent(),
            len = data.x ? data.x.length : 0,
            str = '',
            attr = '',
            i;

        for(i = 0; i < len; i++){
            if(data.x[i] > 0){
                str += '<x v="' + data.x[i] + '"/>';
            } else {
                str += '<x/>';
            }
        }
        data.x = str;

        if(data.t) {
            attr += ' t="' + data.t + '"';
        }

        if(data.r > 0) {
            attr += ' r="' + data.r + '"';
        }

        if(data.i > 0) {
            attr += ' i="' + data.i + '"';
        }

        data.attr = attr;

        return data;
    },

    applyX: function(data){
        return data != null ? Ext.Array.from(data) : null;
    }

});