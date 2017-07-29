/**
 * This class defines an update operation that occurs on records belonging to a
 * {@link Ext.pivot.result.Base result}.
 *
 * This class should be extended to provide the update operation algorithm.
 *
 * How does such an update work?
 *
 * The {@link Ext.pivot.result.Base result object} contains an array of records that participate
 * in the result aggregation. The {@link #value} is used to update all these records on the
 * {@link #dataIndex} field.
 *
 * **Note:** These updaters are used by the {@link Ext.pivot.plugin.RangeEditor} plugin.
 */
Ext.define('Ext.pivot.update.Base', {
    extend: 'Ext.mixin.Observable',
    alias: 'pivotupdate.base',

    mixins: [
        'Ext.mixin.Factoryable'
    ],

    config: {
        /**
         * @cfg {String} leftKey (required)
         *
         *  Key of left axis item or grandTotalKey
         */
        leftKey: null,
        /**
         * @cfg {String} topKey (required)
         *
         * Key of top axis item or grandTotalKey
         */
        topKey: null,
        /**
         * @cfg {Ext.pivot.matrix.Base} matrix (required)
         *
         * Reference to the matrix object
         */
        matrix: null,
        /**
         * @cfg {String} dataIndex (required)
         *
         * Field that needs to be updated on all records found on the {@link Ext.pivot.result.Base matrix result}.
         */
        dataIndex: null,
        /**
         * @cfg {Variant} value
         *
         * The new value that is set for each record found on the {@link Ext.pivot.result.Base matrix result}.
         */
        value: null
    },

    destroy: function(){
        Ext.unasap(this.updateTimer);
        this.setMatrix(null);
        this.callParent();
    },

    getResult: function(){
        var matrix = this.getMatrix();
        return matrix ? matrix.results.get(this.getLeftKey(), this.getTopKey()) : null;
    },

    /**
     * Update values on the specified {@link Ext.pivot.result.Base matrix result} records.
     *
     * @return {Ext.Promise}
     */
    update: function(){
        var me = this;

        /**
         * Fires before updating all result records.
         *
         * @event beforeupdate
         * @param {Ext.pivot.update.Base} updater Reference to the updater object
         */

        /**
         * Fires after updating all result records.
         *
         * @event update
         * @param {Ext.pivot.update.Base} updater Reference to the updater object
         */

        Ext.unasap(me.updateTimer);
        return new Ext.Promise(function (resolve, reject) {
            //<debug>
            if (!me.getMatrix() || !me.getDataIndex()) {
                Ext.raise('Invalid configuration');
            }
            //</debug>
            var result = me.getResult();

            if(result) {
                if (me.fireEvent('beforeupdate', me) !== false) {
                    me.updateTimer = Ext.asap(me.onUpdate, me, [result, resolve, reject]);
                } else {
                    reject('Operation canceled!');
                }
            }else{
                reject('No Result found!');
            }
        });
    },

    /**
     * Overwrite this function to provide update operation algorithm.
     *
     * @param {Ext.pivot.result.Base} result
     * @param {Function} resolve Function called if operation is successful
     * @param {Function} reject Function called if operation fails
     */
    onUpdate: function(result, resolve, reject){
        this.fireEvent('update', this);
        resolve(this);
    }
});
