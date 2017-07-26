/**
 * This class stores the matrix results. When the pivot component uses the
 * {@link Ext.pivot.matrix.Local} matrix then this class does
 * calculations in the browser.
 */
Ext.define('Ext.pivot.result.Collection', {
    alternateClassName: [
        'Mz.aggregate.matrix.Results'
    ],

    requires: [
        'Ext.pivot.MixedCollection',
        'Ext.pivot.result.Base'
    ],

    /**
     * @cfg {String} resultType
     *
     * Define here what class to be used when creating {@link Ext.pivot.result.Base Result} objects
     */
    resultType: 'base',

    /**
     * @property {Ext.pivot.MixedCollection} items
     *
     * Collection of {@link Ext.pivot.result.Base Result} objects
     *
     * @private
     */
    items:  null,

    /**
     * @cfg {Ext.pivot.matrix.Base} matrix
     *
     * Reference to the matrix object
     */
    matrix: null,

    constructor: function(config){
        var me = this;

        Ext.apply(me, config || {});

        me.items = new Ext.pivot.MixedCollection();
        me.items.getKey = function(obj){
            return obj.leftKey + '/' + obj.topKey;
        };

        return me.callParent(arguments);
    },

    destroy: function(){
        var me = this;

        Ext.destroy(me.items);
        me.matrix = me.items = null;

        me.callParent(arguments);
    },

    /**
     * Clear all calculated results.
     *
     */
    clear: function(){
        this.items.clear();
    },

    /**
     * Add a new Result object by left/top axis keys.
     *
     * If there is already a Result object for the left/top axis pair then return that one.
     *
     * @param leftKey
     * @param topKey
     * @returns {Ext.pivot.result.Base}
     */
    add: function(leftKey, topKey){
        var obj = this.get(leftKey, topKey);

        if(!obj){

            obj = this.items.add(Ext.Factory.pivotresult({
                type:           this.resultType,
                leftKey:        leftKey,
                topKey:         topKey,
                matrix:         this.matrix
            }));
        }

        return obj;
    },

    /**
     * Returns the Result object for the specified left/top axis keys
     *
     * @param leftKey
     * @param topKey
     * @returns {Ext.pivot.result.Base}
     */
    get: function(leftKey, topKey){
        return this.items.getByKey(leftKey + '/' + topKey);
    },

    remove: function(leftKey, topKey){
        this.items.removeAtKey(leftKey + '/' + topKey);
    },

    /**
     * Return all Result objects for the specified leftKey
     *
     * @param leftKey
     * @returns Array
     */
    getByLeftKey: function(leftKey){
        var col = this.items.filterBy(function(item, key){
            var keys = String(key).split('/');
            return (leftKey == keys[0]);
        });

        return col.getRange();
    },

    /**
     * Return all Result objects for the specified topKey
     *
     * @param topKey
     * @returns Array
     */
    getByTopKey: function(topKey){
        var col = this.items.filterBy(function(item, key){
            var keys = String(key).split('/');
            return (keys.length > 1 && topKey == keys[1]);
        });

        return col.getRange();
    },

    /**
     * Calculate aggregate values for each available Result object
     *
     */
    calculate: function(){
        var len = this.items.getCount(),
            i;

        for(i = 0; i < len; i++){
            this.items.getAt(i).calculate();
        }
    }
});