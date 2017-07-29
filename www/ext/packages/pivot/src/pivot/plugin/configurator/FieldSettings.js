/**
 * This class allows you to define various settings for each configurator field.
 */
Ext.define('Ext.pivot.plugin.configurator.FieldSettings', {
    $configStrict: false,

    config: {
        /**
         * @cfg {String} cls
         *
         * CSS class to add to this configurator field
         */
        cls: '',

        /**
         * @cfg {String/Object} style Similar to {@link Ext.Component#style Component style config}.
         */
        style: null,

        /**
         * @cfg {String/Array} fixed
         *
         * If you want a field to be fixed in a specific area then you must define those areas here.
         *
         * Possible values:
         *
         * - `aggregate`: "values" area;
         * - `leftAxis`: "row values" area;
         * - `topAxis`: "column values" area;
         *
         */
        fixed: [],

        /**
         * @cfg {String[]} allowed
         *
         * Define here the areas where this field can be used.
         *
         * Possible values:
         *
         * - `aggregate`: "values" area;
         * - `leftAxis`: "row values" area;
         * - `topAxis`: "column values" area;
         *
         */
        allowed: ['leftAxis', 'topAxis', 'aggregate'],

        /**
         * @cfg {String[]} aggregators
         *
         * Define here the functions that can be used when the dimension is configured as an aggregate.
         *
         * If you need to use your own function then you could override {@link Ext.pivot.Aggregators} like this:
         *
         *      Ext.define('overrides.pivot.Aggregators', {
         *          customFn: function(){
         *              // ... do your own calculation
         *          },
         *          customFnText: 'Custom fn'
         *      });
         *
         * Do not forget to define a text for your function. It will be displayed inside the 'Summarize by' field of
         * the FieldSettings window.
         *
         * If no text is defined then `Custom` will be used.
         *
         * You can also provide a function on the view controller and it will appear in the FieldSettings window as
         * "Custom".
         *
         */
        aggregators: [
            'sum', 'avg', 'min', 'max', 'count', 'countNumbers', 'groupSumPercentage', 'groupCountPercentage',
            'variance', 'varianceP', 'stdDev', 'stdDevP'
        ],

        /**
         * @cfg {Object} renderers
         *
         * These renderers are used only on the aggregate dimensions.
         *
         * The expected value is an object. Each key of this object is a text that will be shown in the "Format as" field
         * in the FieldSettings window. Check out the {@link Ext.grid.column.Column#renderer grid column renderer}
         * to see what is supported.
         *
         *      renderers: {
         *          'Colored 0,000.00': 'coloredRenderer' // function on the controller
         *      }
         *
         */
        renderers: {},

        /**
         * @cfg {Object} formatters
         *
         * Formatters are used only on the aggregate dimensions.
         *
         * The expected value is an object. Each key of this object is a text that will be shown in the "Format as" field
         * in the FieldSettings window. Check out the {@link Ext.grid.column.Column#formatter grid column formatter}
         * to see what is supported.
         *
         *      formatters: {
         *          '0': 'number("0")',
         *          '0%': 'number("0%")'
         *      }
         *
         */
        formatters: {}
    },

    isFieldSettings: true,

    constructor: function(config){
        this.initConfig(config || {});
        return this.callParent(arguments);
    },

    getDefaultEmptyArray: function(prop){
        var ret = this['_' + prop];

        if(!ret){
            ret = [];
            this['set' + Ext.String.capitalize(prop)](ret);
        }

        return ret;
    },

    applyArrayValues: function(prop, newValue, oldValue){
        if(newValue == null || (newValue && Ext.isArray(newValue))){
            return newValue;
        }

        if(newValue){
            if(!oldValue){
                oldValue = this['get' + Ext.String.capitalize(prop)]();
            }

            Ext.Array.splice(oldValue, 0, oldValue.length, newValue);
        }

        return oldValue;
    },

    getFixed: function(){
        return this.getDefaultEmptyArray('fixed');
    },

    applyFixed: function(newValue, oldValue){
        return this.applyArrayValues('fixed', newValue, oldValue);
    },

    getAllowed: function(){
        return this.getDefaultEmptyArray('allowed');
    },

    applyAllowed: function(newValue, oldValue){
        return this.applyArrayValues('allowed', newValue, oldValue);
    },

    getAggregators: function(){
        return this.getDefaultEmptyArray('aggregators');
    },

    applyAggregators: function(newValue, oldValue){
        return this.applyArrayValues('aggregators', newValue, oldValue);
    },

    /**
     * Check if this field is fixed in the specified container or not.
     *
     * @param {Ext.pivot.plugin.configurator.Container} fromContainer
     * @return {Boolean}
     */
    isFixed: function(fromContainer){
        var type;

        if(!fromContainer){
            return false;
        }
        type = fromContainer.getFieldType();
        return Ext.Array.indexOf(this.getFixed(), type) >= 0;
    },

    /**
     * Check if this field is allowed to be added to the specified container
     *
     * @param {Ext.pivot.plugin.configurator.Container} toContainer
     * @return {Boolean}
     */
    isAllowed: function(toContainer){
        var fixed = this.getFixed(),
            type;

        if(!toContainer){
            return false;
        }

        type = toContainer.getFieldType();

        if(fixed.length){
            // if we have 'fixed' constraints then we can only move there
            return Ext.Array.indexOf(fixed, type) >= 0;
        }

        return (type === 'all') || (Ext.Array.indexOf(this.getAllowed(), type) >= 0);
    }

});