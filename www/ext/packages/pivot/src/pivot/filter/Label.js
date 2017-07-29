/**
 * Label filter class. Use this filter type when you want to filter
 * the left/top axis results by their values.
 *
 * Example:
 *
 *      {
 *          xtype: 'pivotgrid',
 *
 *          matrix: {
 *              // This example will generate a grid column for the year 2012
 *              // instead of columns for all unique years.
 *              topAxis: [{
 *                  dataIndex:  'year',
 *                  header:     'Year',
 *                  filter: {
 *                      type:       'label',
 *                      operator:   '=',
 *                      value:      2012
 *                  }
 *              }]
 *
 *              leftAxis: [{
 *                  dataIndex:  'country',
 *                  header:     'Country',
 *                  filter: {
 *                      type:       'label',
 *                      operator:   'in',
 *                      value:      ['USA', 'Canada', 'Australia']
 *                  }
 *              }]
 *          }
 *      }
 *
 */
Ext.define('Ext.pivot.filter.Label', {
    alternateClassName: [
        'Mz.aggregate.filter.Label'
    ],

    extend: 'Ext.pivot.filter.Base',

    alias: 'pivotfilter.label',

    /**
     * @cfg {String} operator
     * @inheritdoc
     * @localdoc
     *  * `begins`
     *  * `not begins`
     *  * `ends`
     *  * `not ends`
     *  * `contains`
     *  * `not contains`
     *  * `in`
     *  * `not in`
     *
     * The `in` and `not in` operators expect this filter's {@link #value} to be an array of values.
     *
     */


    /**
     * @inheritdoc
     */
    isMatch: function(value){
        var me = this,
            v;
        
        if(me.operator == 'begins'){
            return Ext.String.startsWith(String(value || ''), String(me.value || ''), !me.caseSensitive);
        }
        
        if(me.operator == 'not begins'){
            return !Ext.String.startsWith(String(value || ''), String(me.value || ''), !me.caseSensitive);
        }
        
        if(me.operator == 'ends'){
            return Ext.String.endsWith(String(value || ''), String(me.value || ''), !me.caseSensitive);
        }
        
        if(me.operator == 'not ends'){
            return !Ext.String.endsWith(String(value || ''), String(me.value || ''), !me.caseSensitive);
        }
        
        if(me.operator == 'contains'){
            return me.stringContains(String(value || ''), String(me.value || ''), !me.caseSensitive);
        }
        
        if(me.operator == 'not contains'){
            return !me.stringContains(String(value || ''), String(me.value || ''), !me.caseSensitive);
        }

        if(me.operator == 'in'){
            return me.foundInArray(me.value);
        }

        if(me.operator == 'not in'){
            return !me.foundInArray(me.value);
        }

        // no valid operator was specified. check if it matches the parent class.
        return me.callParent(arguments);
    },

    foundInArray: function(item){
        var values = Ext.Array.from(this.value),
            len = values.length,
            found = false,
            i;

        if(this.caseSensitive){
            return Ext.Array.indexOf(values, item) >= 0;
        }else{
            for(i = 0; i < len; i++){
                found = found || (String(item).toLowerCase() == String(values[i]).toLowerCase());
                if(found){
                    break;
                }
            }
            return found;
        }
    },
    
    /**
     * Check if the specified string contains the substring
     *
     * @param {String} s The original string
     * @param {String} start The substring to check
     * @param {Boolean} [ignoreCase=false] True to ignore the case in the comparison
     *
     * @private
     */
    stringContains: function(s, start, ignoreCase){
        var result = (start.length <= s.length);
        
        if(result){
            if (ignoreCase) {
                s = s.toLowerCase();
                start = start.toLowerCase();
            }
            result = (s.lastIndexOf(start) >= 0);
        }
        
        return result;
    },

    deprecated: {
        '6.0': {
            methods: {
                /**
                 * Checks if a string starts with a substring
                 *
                 * @deprecated 6.0 This method is deprecated.
                 *
                 * @method startsWith
                 * @param {String} s The original string
                 * @param {String} start The substring to check
                 * @param {Boolean} [ignoreCase=false] True to ignore the case in the comparison
                 */
                startsWith: Ext.emptyFn,
                /**
                 * Checks if a string ends with a substring
                 *
                 * @deprecated 6.0 This method is deprecated.
                 *
                 * @method endsWith
                 * @param {String} s The original string
                 * @param {String} end The substring to check
                 * @param {Boolean} [ignoreCase=false] True to ignore the case in the comparison
                 */
                endsWith: Ext.emptyFn
            }
        }
    }
});
