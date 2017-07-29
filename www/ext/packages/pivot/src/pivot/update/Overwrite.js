/**
 * This updater overwrites the value on all records found on the {@link Ext.pivot.result.Base matrix result}.
 *
 * Let's say that the result object contains the following records (each record is a
 * {@link Ext.data.Model model} in fact but we use json representation for this example):
 *
 *      [
 *          { product: 'Phone', country: 'USA', order: 100 },
 *          { product: 'Tablet', country: 'USA', order: 200 }
 *      ]
 *
 * And we want all orders to have the same value of 250. This is how the updater config looks like:
 *
 *      {
 *          type: 'overwrite',
 *          leftKey: resultLeftKey,
 *          topKey: resultTopKey,
 *          matrix: matrix,
 *          dataIndex: 'order',
 *          value: 250
 *      }
 *
 * And this is how the records look after the update:
 *
 *      [
 *          { product: 'Phone', country: 'USA', order: 250 },
 *          { product: 'Tablet', country: 'USA', order: 250 }
 *      ]
 *
 */
Ext.define('Ext.pivot.update.Overwrite', {
    extend: 'Ext.pivot.update.Base',

    alias: 'pivotupdate.overwrite',

    onUpdate: function(result, resolve, reject) {
        // This could fire asynchronously after we've been destroyed
        if (this.destroyed) {
            return;
        }
        
        var dataIndex = this.getDataIndex(),
            value = parseFloat(this.getValue()),
            records = result.records,
            len, i;

        if (isNaN(value)) {
            value = null;
        }

        if(records) {
            len = records.length;

            for (i = 0; i < len; i++) {
                records[i].set(dataIndex, value);
            }
        }

        this.callParent([result, resolve, reject]);
    }
});
