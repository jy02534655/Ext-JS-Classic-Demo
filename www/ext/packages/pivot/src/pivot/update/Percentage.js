/**
 * This updater changes all records found on the {@link Ext.pivot.result.Base matrix result}
 * using the specified value as a percentage.
 *
 * Let's say that the result object contains the following records (each record is a
 * {@link Ext.data.Model model} in fact but we use json representation for this example):
 *
 *      [
 *          { product: 'Phone', country: 'USA', order: 100 },
 *          { product: 'Tablet', country: 'USA', order: 200 }
 *      ]
 *
 * And we want to increase all orders by 150%. This is how the updater config looks like:
 *
 *      {
 *          type: 'percentage',
 *          leftKey: resultLeftKey,
 *          topKey: resultTopKey,
 *          matrix: matrix,
 *          dataIndex: 'order',
 *          value: 150
 *      }
 *
 * And this is how the records look after the update:
 *
 *      [
 *          { product: 'Phone', country: 'USA', order: 150 },
 *          { product: 'Tablet', country: 'USA', order: 300 }
 *      ]
 *
 */
Ext.define('Ext.pivot.update.Percentage', {
    extend: 'Ext.pivot.update.Base',

    alias: 'pivotupdate.percentage',

    onUpdate: function(result, resolve, reject){
        // This could fire asynchronously after we've been destroyed
        if (this.destroyed) {
            return;
        }

        var dataIndex = this.getDataIndex(),
            value = parseFloat(this.getValue()),
            records = result.records,
            len, i, rec;

        if (isNaN(value)) {
            value = null;
        }

        if(records) {
            len = records.length;

            for (i = 0; i < len; i++) {
                rec = records[i];
                rec.set(dataIndex, value === null ? null : Math.floor(rec.get(dataIndex) * value / 100));
            }
        }

        this.callParent([result, resolve, reject]);
    }
});