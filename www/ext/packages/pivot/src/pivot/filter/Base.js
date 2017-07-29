/**
 * Base implementation of a filter. It handles common type of filters.
 */
Ext.define('Ext.pivot.filter.Base', {
    alternateClassName: [
        'Mz.aggregate.filter.Abstract'
    ],

    alias: 'pivotfilter.base',

    mixins: [
        'Ext.mixin.Factoryable'
    ],

    isFilter: true,

    /**
     * @cfg {String} type
     * Used when you define a filter on a dimension to set what kind of filter is to be
     * instantiated.
     */

    /**
     * @cfg {String} operator (required)
     * Operator to use to compare labels/values to this Filter's {@link #value}.
     *
     * The `between` and `not between` operators expect this filter's {@link #value} to be an array with two values.
     *
     * Possible values are:
     *
     *  - `<`
     *  - `<=`
     *  - `=`
     *  - `>=`
     *  - `>`
     *  - `!=`
     *  - `between`
     *  - `not between`
     */
    operator: null,

    /**
     * @cfg {String/Array} value (required)
     * Value to filter by. For 'between' and 'not between' operators this should be an array of values.
     */
    value: null,

    /**
     * @cfg {Boolean} caseSensitive
     * During filtering should we use case sensitive comparison?
     *
     */
    caseSensitive:  true,

    /**
     * @property {Ext.pivot.dimension.Item} parent
     * Reference to the parent dimension object.
     * @readonly
     * @private
     */
    parent: null,

    constructor: function(config){
        var me = this,
            fmt = Ext.util.Format;

        // define thousand and decimal separator regexp
        me.thousandRe = new RegExp('[' + fmt.thousandSeparator + ']', 'g');
        me.decimalRe = new RegExp('[' + fmt.decimalSeparator + ']');

        Ext.apply(this, config);
        return this.callParent([config]);
    },

    destroy: function(){
        var me = this;

        me.parent = me.thousandRe = me.decimalRe = null;
        me.callParent();
    },
    
    /**
     * Returns the serialized filter data as an object.
     *
     * @returns {Object}
     */
    serialize: function(){
        var me = this;
        
        return Ext.apply({
            type:           me.type,
            operator:       me.operator,
            value:          me.value,
            caseSensitive:  me.caseSensitive
        }, me.getSerialArgs() || {});
    },
    
    /**
     * @method
     * Template method to be implemented by all subclasses that is used to
     * get and return serialized filter data.
     *
     * Defaults to Ext.emptyFn.
     *
     */
    getSerialArgs: Ext.emptyFn,
    
    /**
     * Check if the specified value matches the filter.
     *
     * @returns Boolean True if the value matches the filter
     * @param value
     *
     */
    isMatch: function(value){
        var me = this,
            v = me.value,
            ret, retFrom, retTo, from, to;

        v = (Ext.isArray(v) ? v[0] : v) || '';
        ret = me.compare(value, v);

        if(me.operator == '='){
            return (ret === 0);
        }

        if(me.operator == '!='){
            return (ret !== 0);
        }

        if(me.operator == '>'){
            return (ret > 0);
        }

        if(me.operator == '>='){
            return (ret >= 0);
        }

        if(me.operator == '<'){
            return (ret < 0);
        }

        if(me.operator == '<='){
            return (ret <= 0);
        }

        v = me.value;
        from = (Ext.isArray(v) ? v[0] : v) || '';
        to = (Ext.isArray(v) ? v[1] : v) || '';
        retFrom = me.compare(value, from);
        retTo = me.compare(value, to);

        if(me.operator == 'between'){
            return (retFrom >= 0 && retTo <= 0);
        }

        if(me.operator == 'not between'){
            return !(retFrom >= 0 && retTo <= 0);
        }

        // no valid operator was specified. ignore filtering
        return true;
    },

    /**
     * Check if the specified value is a number and returns it.
     *
     * Takes care of the regional settings (decimal and thousand separators).
     *
     * @param value
     * @return {Number} Returns the number or null if the value is not numeric
     * @private
     */
    parseNumber: function(value){
        var v;

        if(typeof value === 'number'){
            return value;
        }

        if(Ext.isEmpty(value)){
            value = '';
        }

        // if the value comes as a string it may be a number formatted using locale settings
        // which means that we need to convert it to a number with `.` decimal separator.
        v = String(value).replace(this.thousandRe, '');
        v = v.replace(this.decimalRe, '.');

        if(Ext.isNumeric(v)){
            return parseFloat(v);
        }
        return null;
    },

    /**
     * Compare 2 values and return the result.
     *
     * @param a
     * @param b
     * @private
     */
    compare: function(a, b){
        var sorter = Ext.pivot.matrix.Base.prototype.naturalSort,
            v1 = this.parseNumber(a),
            v2 = this.parseNumber(b);

        if(Ext.isNumber(v1) && Ext.isNumber(v2)){
            return sorter(v1, v2);
        }

        if( Ext.isDate(a) ){
            if(Ext.isDate(b)){
                return sorter(a, b);
            }else{
                return sorter(a, Ext.Date.parse(b, Ext.Date.defaultFormat));
            }
        }

        return (this.caseSensitive ? sorter(a || '', b || '') : sorter(String(a || '').toLowerCase(), String(b || '').toLowerCase()));

    },

    deprecated: {
        '6.0': {
            properties: {
                /**
                 * @cfg {String} mztype
                 *
                 * @deprecated 6.0 Use {@link #type} instead. The old type config was renamed to {@link #operator}.
                 */
                mztype: null,
                /**
                 * @cfg {String} from
                 * @deprecated 6.0 Use {@link #value} instead as an array with 2 values.
                 *
                 * Used in case of a 'between/not between' type of filter
                 *
                 */
                from: null,
                /**
                 * @cfg {String} to
                 * @deprecated 6.0 Use {@link #value} instead as an array with 2 values.
                 *
                 * Used in case of a 'between/not between' operator
                 *
                 */
                to: null
            }
        }
    }
});
