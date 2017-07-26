/**
 * Value filter class. Use this filter type when you want to filter
 * the left/top axis results by the grand total summary values.
 *
 * Example for a value filter:
 *
 *      {
 *          xtype: 'pivotgrid',
 *
 *          matrix: {
 *              // This example will generate a column for each year
 *              // that has its grand total value between 1,000 and 15,000.
 *              aggregate: [{
 *                  id:         'agg',
 *                  dataIndex:  'value',
 *                  aggregator: 'sum',
 *                  header:     'Total'
 *              }],
 *              topAxis: [{
 *                  dataIndex:  'year',
 *                  header:     'Year',
 *                  filter: {
 *                      type:           'value',
 *                      operator:       'between',
 *                      dimensionId:    'agg',  // this is the id of an aggregate dimension
 *                      value:          [1000, 15000]
 *                  }
 *              }]
 *          }
 *      }
 *
 *
 * Top 10 filter works as following:
 *
 * First of all sort axis groups by grand total value of the specified dimension. The sorting
 * order depends on top/bottom configuration.
 *
 *  - Top/Bottom 10 Items: Keep only the top x items from the groups array
 *
 *  - Top/Bottom 10 Percent: Find first combined values to total at least x percent of the parent grandtotal
 *
 *  - Top/Bottom 10 Sum: Find first combined values to total at least x
 *
 *
 * Example for a top 10 value filter:
 *
 *      {
 *          xtype: 'pivotgrid',
 *
 *          matrix: {
 *              // This example will return the bottom 3 years that have the smallest
 *              // sum of value.
 *              aggregate: [{
 *                  id:         'agg',
 *                  dataIndex:  'value',
 *                  aggregator: 'sum',
 *                  header:     'Total'
 *              }],
 *              leftAxis: [{
 *                  dataIndex:  'year',
 *                  header:     'Year',
 *                  filter: {
 *                      type:           'value',
 *                      operator:       'top10',
 *                      dimensionId:    'agg',   // this is the id of an aggregate dimension
 *                      topType:        'items',
 *                      topOrder:       'bottom',
 *                      value:          3
 *                  }
 *              }]
 *          }
 *      }
 *
 */
Ext.define('Ext.pivot.filter.Value', {
    alternateClassName: [
        'Mz.aggregate.filter.Value'
    ],

    extend: 'Ext.pivot.filter.Base',

    alias: 'pivotfilter.value',

    /**
     * @cfg {String} operator
     * @inheritdoc
     * @localdoc
     *    * `top10`
     *
     */

    /**
     * @cfg {String} dimensionId (required)
     *
     * Id of the aggregate dimension used to filter by the specified value
     *
     */
    dimensionId:    '',
    
    /**
     * @cfg {String} [topType="items"]
     *
     * Specify here which kind of Top10 we need to perform.
     * Possible values: items, percent, sum
     *
     */
    topType:        'items',
    
    /**
     * @cfg {String} [topOrder="top"]
     *
     * Which kind of top10 do you want? Possible values: top, bottom
     *
     */
    topOrder:       'top',
    
    /**
     * @cfg {Boolean} [topSort=true]
     *
     * Should the top10 results be sorted? If True then the dimension sorting is ignored and
     * the results are sorted by the grand total in DESC (topOrder = top) or ASC (topOrder = bottom) order.
     *
     */
    topSort:        true,
    
    /**
     * @property {Boolean} isTopFilter
     * @readonly
     *
     * Is this a top10 type of filter?
     *
     */
    isTopFilter:    false,
    
    constructor: function(config){
        var ret = this.callParent([config]);

        //<debug>
        if(Ext.isEmpty(this.dimensionId)){
            Ext.raise('dimensionId is mandatory on Value filters');
        }
        //</debug>

        this.isTopFilter = (this.operator === 'top10');

        return ret;
    },

    destroy: function(){
        this.dimension = null;
        this.callParent();
    },

    getDimension: function(){
        //<debug>
        if(!this.parent.matrix.aggregate.getByKey(this.dimensionId)){
            Ext.raise('There is no aggregate dimension that matches the dimensionId provided');
        }
        //</debug>
        return this.parent.matrix.aggregate.getByKey(this.dimensionId);
    },

    /**
     * @inheritdoc
     */
    getSerialArgs: function(){
        var me = this;

        return {
            dimensionId: me.dimensionId,
            topType: me.topType,
            topOrder: me.topOrder,
            topSort: me.topSort
        };
    },
    
    
    /**
     * This function performs top10 on the specified array.
     *
     * @param axis
     * @param treeItems
     *
     * @private
     */
    applyFilter: function(axis, treeItems){
        var me = this,
            items = me.topSort ? treeItems : Ext.Array.clone(treeItems),
            ret = [];
            
        if(treeItems.length == 0){
            return ret;
        }
        
        //sort the items by the grand total value in ASC(top)/DESC(bottom) order
        me.sortItemsByGrandTotal(axis, items);
        
        switch(me.topType){
            case 'items':
                ret = me.extractTop10Items(items);
            break;
            
            case 'sum':
                ret = me.extractTop10Sum(items);
            break;
            
            case 'percent':
                ret = me.extractTop10Percent(axis, items);
            break;
        }
        
        if(!me.topSort){
            items.length = 0;
        }
        
        return ret;
    },

    /**
     *
     * @param items
     * @returns {Array}
     *
     * @private
     */
    extractTop10Items: function(items){
        // we have to extract all values which are not part of the top
        // ie: we need to extract top2 but there are 3 values which are the same
        var me = this,
            uniqueValues = [],
            i;
            
        for(i = 0; i < items.length; i++){
            if(uniqueValues.indexOf(items[i]['tempVar']) < 0){
                uniqueValues.push(items[i]['tempVar']);
                if(uniqueValues.length > me.value || (me.value < i + 1 && i > 0)){
                    break;
                }
            }
        }
        
        return Ext.Array.slice(items, i);
    },

    /**
     *
     * @param items
     * @returns {Array}
     *
     * @private
     */
    extractTop10Sum: function(items){
        var me = this,
            sum = 0,
            i;
            
        for(i = 0; i < items.length; i++){
            sum += items[i]['tempVar'];
            if(sum >= me.value){
                break;
            }
        }

        return Ext.Array.slice(items, i + 1);
    },

    /**
     *
     * @param axis
     * @param items
     * @returns {Array}
     *
     * @private
     */
    extractTop10Percent: function(axis, items){
        var me = this,
            sum = 0,
            keys = items[0].key.split(axis.matrix.keysSeparator),
            i, leftKey, topKey, parentKey, result, grandTotal;
            
        //let's find the parent grand total
        keys.length--;
        parentKey = (keys.length > 0 ? keys.join(axis.matrix.keysSeparator) : axis.matrix.grandTotalKey);
        leftKey = (axis.isLeftAxis ? parentKey : axis.matrix.grandTotalKey);
        topKey = (axis.isLeftAxis ? axis.matrix.grandTotalKey : parentKey);
        
        result = axis.matrix.results.get(leftKey, topKey);
        grandTotal = (result ? result.getValue(me.dimensionId) : 0);

        for(i = 0; i < items.length; i++){
            sum += items[i]['tempVar'];
            if((sum * 100 / grandTotal) >= me.value){
                break;
            }
        }

        return Ext.Array.slice(items, i + 1);
    },

    /**
     *
     * @param axis
     * @param items
     *
     * @private
     */
    sortItemsByGrandTotal: function(axis, items){
        var me = this,
            leftKey, topKey, result, i;
            
        //let's fetch the grandtotal values and store them in a temp var on each item
        for(i = 0; i < items.length; i++){
            leftKey = (axis.isLeftAxis ? items[i].key : axis.matrix.grandTotalKey);
            topKey = (axis.isLeftAxis ? axis.matrix.grandTotalKey : items[i].key);
            result = axis.matrix.results.get(leftKey, topKey);
            
            items[i]['tempVar'] = (result ? result.getValue(me.dimensionId) : 0);
        }
        
        Ext.Array.sort(items, function(a, b){
            var result = axis.matrix.naturalSort(a['tempVar'], b['tempVar']);
            
            if(result < 0 && me.topOrder === 'top'){
                return 1;
            }
            if(result > 0 && me.topOrder === 'top'){
                return -1;
            }
            return result;
        });
    }
});
