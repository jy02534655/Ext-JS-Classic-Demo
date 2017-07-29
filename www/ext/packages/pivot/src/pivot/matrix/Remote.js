/**
 * This matrix allows you to do all the calculations on the backend.
 * This is handy when you have large data sets.
 *
 * Basically this class sends to the specified URL the following configuration object:
 *
 * - leftAxis: array of serialized dimensions on the left axis
 *
 * - topAxis: array of serialized dimensions on the top axis
 *
 * - aggregate: array of serialized dimensions on the aggregate
 *
 * - keysSeparator: the separator used by the left/top items keys. It's the one defined on the matrix
 *
 * - grandTotalKey: the key for the grand total items. It's the one defined on the matrix
 *
 *
 * The expected JSON should have the following format:
 *
 * - success - true/false
 *
 * - leftAxis - array of items that were generated for the left axis. Each item is an
 * object with keys for: key, value, name, dimensionId. If you send back the item name and you also
 * have a renderer defined then the renderer is not called anymore.
 *
 * - topAxis - array of items that were generated for the top axis.
 *
 * - results - array of results for all left/top axis items. Each result is an object
 * with keys for: leftKey, topKey, values. The 'values' object has keys for each
 * aggregate id that was sent to the backend.
 *
 * Example
 *
 *      // let's assume that we have this configuration on the pivot grid
 *      {
 *          xtype:  'pivotgrid',
 *
 *          matrix: {
 *              type:   'remote',
 *              url:    'your-backend-url'.
 *
 *              aggregate: [{
 *                  id:         'agg1',
 *                  dataIndex:  'value',
 *                  header:     'Sum of value',
 *                  aggregator: 'sum'
 *              },{
 *                  id:         'agg2',
 *                  dataIndex:  'value',
 *                  header:     '# records',
 *                  aggregator: 'count',
 *                  align:      'right',
 *                  renderer:   Ext.util.Format.numberRenderer('0')
 *              }],
 *
 *              leftAxis: [{
 *                  id:         'person',
 *                  dataIndex:  'person',
 *                  header:     'Person',
 *                  sortable:   false
 *              },{
 *                  id:         'country',
 *                  dataIndex:  'country',
 *                  header:     'Country'
 *              }],
 *
 *              topAxis: [{
 *                  id:         'year',
 *                  dataIndex:  'year',
 *                  header:     'Year'
 *              },{
 *                  id:         'month',
 *                  dataIndex:  'month',
 *                  header:     'Month'
 *              }]
 *          }
 *      }
 *
 *      // this is the expected result from the server
 *      {
 *          "success": true,
 *          "leftAxis": [{
 *              "key": "john",
 *              "value": "John",
 *              "name": "John",
 *              "dimensionId": "person"
 *          }, {
 *              "key": "john#_#usa",
 *              "value": "USA",
 *              "name": "United States of America",
 *              "dimensionId": "country"
 *          }, {
 *              "key": "john#_#canada",
 *              "value": "Canada",
 *              "name": "Canada",
 *              "dimensionId": "country"
 *          }],
 *          "topAxis": [{
 *              "key": "2014",
 *              "value": "2014",
 *              "name": "2014",
 *              "dimensionId": "year"
 *          }, {
 *              "key": "2014#_#2",
 *              "value": "2",
 *              "name": "February",
 *              "dimensionId": "month"
 *          }],
 *          "results": [{
 *              "leftKey": "grandtotal",
 *              "topKey": "grandtotal",
 *              "values": {
 *                  "agg1": 100,
 *                  "agg2": 20
 *              }
 *          }, {
 *              "leftKey": "john",
 *              "topKey": "grandtotal",
 *              "values": {
 *                  "agg1": 100,
 *                  "agg2": 20
 *              }
 *          }, {
 *              "leftKey": "john#_#canada",
 *              "topKey": "grandtotal",
 *              "values": {
 *                  "agg1": 70,
 *                  "agg2": 13
 *              }
 *          }, {
 *              "leftKey": "john#_#usa",
 *              "topKey": "grandtotal",
 *              "values": {
 *                  "agg1": 30,
 *                  "agg2": 7
 *              }
 *          }, {
 *              "leftKey": "grandtotal",
 *              "topKey": "2014",
 *              "values": {
 *                  "agg1": 100,
 *                  "agg2": 20
 *              }
 *          }, {
 *              "leftKey": "grandtotal",
 *              "topKey": "2014#_#2",
 *              "values": {
 *                  "agg1": 50,
 *                  "agg2": 70
 *              }
 *          }, {
 *              "leftKey": "john",
 *              "topKey": "2014",
 *              "values": {
 *                  "agg1": 100,
 *                  "agg2": 20
 *              }
 *          }, {
 *              "leftKey": "john",
 *              "topKey": "2014#_#2",
 *              "values": {
 *                  "agg1": 100,
 *                  "agg2": 20
 *              }
 *          }, {
 *              "leftKey": "john#_#usa",
 *              "topKey": "2014",
 *              "values": {
 *                  "agg1": 70,
 *                  "agg2": 13
 *              }
 *          }, {
 *              "leftKey": "john#_#usa",
 *              "topKey": "2014#_#2",
 *              "values": {
 *                  "agg1": 70,
 *                  "agg2": 13
 *              }
 *          }, {
 *              "leftKey": "john#_#canada",
 *              "topKey": "2014",
 *              "values": {
 *                  "agg1": 30,
 *                  "agg2": 7
 *              }
 *          }, {
 *              "leftKey": "john#_#canada",
 *              "topKey": "2014#_#2",
 *              "values": {
 *                  "agg1": 30,
 *                  "agg2": 7
 *              }
 *          }]
 *      }
 *
 *
 * It is very important to use the dimension IDs that were sent to the backend
 * instead of creating new ones.
 *
 * This class can also serve as an example for implementing various types of
 * remote matrix.
 */
Ext.define('Ext.pivot.matrix.Remote', {
    alternateClassName: [
        'Mz.aggregate.matrix.Remote'
    ],

    extend: 'Ext.pivot.matrix.Base',
    
    alias:  'pivotmatrix.remote',

    isRemoteMatrix: true,

    /**
     * Fires before requesting data from the server side.
     * Return false if you don't want to make the Ajax request.
     *
     * @event beforerequest
     * @param {Ext.pivot.matrix.Remote} matrix Reference to the Matrix object
     * @param {Object} params Params sent by the Ajax request
     */

    /**
     * Fires if there was any Ajax exception or the success value in the response was false.
     *
     * @event requestexception
     * @param {Ext.pivot.matrix.Remote} matrix Reference to the Matrix object
     * @param {Object} response The Ajax response object
     */

    /**
     * @cfg {String} url
     *
     * URL on the server side where the calculations are performed.
     */
    url:        '',
    /**
     * @cfg {Number} timeout
     *
     * The timeout in miliseconds to be used for the server side request.
     * Default to 30 seconds.
     */
    timeout:    3000,

    /**
     * @method
     *
     * Template function called before doing the Ajax request
     * You could change the request params in a subclass if you implement this method.
     * Return false if you don't want to make the Ajax request.
     *
     * @param {Object} params
     */
    onBeforeRequest: Ext.emptyFn,
    
    /**
     * @method
     *
     * Template function called if there was any Ajax exception or the success value
     * in the response was false.
     * You could handle the exception in a subclass if you implement this method.
     *
     * @param {Object} response
     */
    onRequestException: Ext.emptyFn,

    onInitialize: function(){
        var me = this;

        me.remoteDelayedTask = new Ext.util.DelayedTask(me.delayedProcess, me);

        me.callParent(arguments);
    },

    onDestroy: function(){
        this.remoteDelayedTask.cancel();
        this.remoteDelayedTask = null;
        this.callParent();
    },

    startProcess: function(){
        var me = this;
        
        if(Ext.isEmpty(me.url)){
            // nothing to do
            return;
        }
        
        me.clearData();
        
        // let's start the process
        me.fireEvent('start', me);

        me.statusInProgress = false;
        
        me.remoteDelayedTask.delay(5);
    },
    
    delayedProcess: function(){
        var me = this,
            matrix = me.serialize(),
            ret, params;
        
        params = {
            keysSeparator:  me.keysSeparator,
            grandTotalKey:  me.grandTotalKey,
            leftAxis:       matrix.leftAxis,
            topAxis:        matrix.topAxis,
            aggregate:      matrix.aggregate
        };
        
        ret = me.fireEvent('beforerequest', me, params);
        
        if(ret !== false){
            if(Ext.isFunction(me.onBeforeRequest)){
                ret = me.onBeforeRequest(params);
            }
        }
        
        if(ret === false){
            me.endProcess();        
        }else{
            // do an Ajax call to the configured URL and fetch the results
            Ext.Ajax.request({
                url:        me.url,
                timeout:    me.timeout,
                jsonData:   params,
                callback:   me.processRemoteResults,
                scope:      me
            });
        }
    },
    
    /**
     * Ajax request callback
     *
     * @private
     */
    processRemoteResults: function(options, success, response){
        var me = this,
            exception = !success,
            data = Ext.JSON.decode(response.responseText, true),
            items, item, len, i;
        
        if(success){
            exception = (!data || !data['success']);
        }
        
        if(exception){
            // handle exception
            me.fireEvent('requestexception', me, response);
            
            if(Ext.isFunction(me.onRequestException)){
                me.onRequestException(response);
            }

            me.endProcess();
            return;
        }

        items = Ext.Array.from(data.leftAxis || []);
        len = items.length;
        for(i = 0; i < len; i++){
            item = items[i];
            if(Ext.isObject(item)){
                me.leftAxis.addItem(item);
            }
        }

        items = Ext.Array.from(data.topAxis || []);
        len = items.length;
        for(i = 0; i < len; i++){
            item = items[i];
            if(Ext.isObject(item)){
                me.topAxis.addItem(item);
            }
        }

        items = Ext.Array.from(data.results || []);
        len = items.length;
        for(i = 0; i < len; i++){
            item = items[i];
            if(Ext.isObject(item)){
                var result = me.results.add(item.leftKey || '', item.topKey || '');
                Ext.Object.each(item.values || {}, result.addValue, result);
            }
        }

        me.endProcess();
    }
    
});
