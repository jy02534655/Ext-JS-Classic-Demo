/**
 * Base implementation of a result object.
 *
 * The Result object stores all calculated values for the aggregate dimensions
 * for a left/top item pair.
 */
Ext.define('Ext.pivot.result.Base', {

    alias: 'pivotresult.base',

    mixins: [
        'Ext.mixin.Factoryable'
    ],

    /**
     * @cfg {String} leftKey (required)
     *
     *  Key of left axis item or grandTotalKey
     */
    leftKey:        '',
    /**
     * @cfg {String} topKey (required)
     *
     * Key of top axis item or grandTotalKey
     */
    topKey:         '',
    /**
     * @property {Boolean} dirty
     *
     * Set this flag on true if you modified at least one record in this result.
     * The grid cell will be marked as dirty in such a case.
     */
    dirty:          false,

    /**
     * @property {Object} values
     *
     * Object that stores all calculated values for each pivot aggregate.
     * The object keys are the dimension ids.
     *
     * @private
     */
    values:         null,
    /**
     * @property {Ext.pivot.matrix.Base} matrix
     * @readonly
     *
     * Reference to the matrix object
     */
    matrix:         null,

    constructor: function(config){
        var me = this;

        Ext.apply(me, config || {});
        me.values = {};

        return me.callParent(arguments);
    },

    destroy: function(){
        var me = this;

        me.matrix = me.values = null;
        me.leftAxisItem = me.topAxisItem = null;

        return me.callParent(arguments);
    },

    /**
     * @method
     * Calculate all pivot aggregate dimensions for the internal records. Useful when using a
     * {@link Ext.pivot.matrix.Local Local} matrix.
     *
     */
    calculate: Ext.emptyFn,

    /**
     * @method
     *
     * Besides the calculation functions defined on your aggregate dimension you could
     * calculate values based on other store fields and custom functions.
     *
     * @param key The generated value will be stored in the result under this key for later extraction
     * @param dataIndex The dataIndex that should be used on the records for doing calculations
     * @param aggFn Your custom function
     */
    calculateByFn: Ext.emptyFn,

    /**
     * Add the calculated value for an aggregate dimension to the internal values storage
     *
     * @param dimensionId
     * @param value
     */
    addValue: function(dimensionId, value){
        this.values[dimensionId] = value;
    },

    /**
     * Returns the calculated value for the specified aggregate dimension
     *
     * @param dimensionId
     */
    getValue: function(dimensionId){
        return this.values[dimensionId];
    },

    /**
     * Check if the value was already calculated for the specified dimension
     *
     * @param dimensionId
     * @return {Boolean}
     */
    hasValue: function(dimensionId) {
        return (dimensionId in this.values);
    },

    /**
     * Returns the left axis item
     *
     * @returns {Ext.pivot.axis.Item}
     */
    getLeftAxisItem: function(){
        return this.matrix.leftAxis.items.getByKey(this.leftKey);
    },

    /**
     * Returns the top axis item
     *
     * @returns {Ext.pivot.axis.Item}
     */
    getTopAxisItem: function(){
        return this.matrix.topAxis.items.getByKey(this.topKey);
    }
});