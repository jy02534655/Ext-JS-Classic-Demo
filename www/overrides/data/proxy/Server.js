//重写类
Ext.define('override.data.proxy.Server', {
    override: 'Ext.data.proxy.Server',
    buildRequest: function (operation) {
        var me = this,
            initialParams = Ext.apply({}, operation.getParams()),
            // Clone params right now so that they can be mutated at any point further down the call stack 
            params = Ext.applyIf(initialParams, me.getExtraParams() || {}),
            request,
            operationId,
            idParam;

        //copy any sorters, filters etc into the params so they can be sent over the wire 
        Ext.applyIf(params, me.getParams(operation));
        
        // Set up the entity id parameter according to the configured name. 
        // This defaults to "id". But TreeStore has a "nodeParam" configuration which 
        // specifies the id parameter name of the node being loaded. 
        operationId = operation.getId();
        idParam = me.getIdParam();
        if (operationId !== undefined && params[idParam] === undefined) {
            params[idParam] = operationId;
        }
        //纳新的需求重写参数
        //Ext.applyIf(params, me.neuropathyData(me.ajaxName,params[me.getLimitParam()], params[me.getPageParam()], params, me.paramsName));
        request = new Ext.data.Request({
            params: params,
            action: operation.getAction(),
            records: operation.getRecords(),
            url: operation.getUrl(),
            operation: operation,

            // this is needed by JsonSimlet in order to properly construct responses for 
            // requests from this proxy 
            proxy: me
        });

        request.setUrl(me.buildUrl(request));

        /*
         * Save the request on the Operation. Operations don't usually care about Request and Response data, but in the
         * ServerProxy and any of its subclasses we add both request and response as they may be useful for further processing
         */
        operation.setRequest(request);

        return request;
    },
    //纳新的需求重写参数
    neuropathyData: function (name, limit, page, params, paramsName) {
        if (!name) {
            return {};
        }
        data = {
            p0: name,
            p1: this.getP1(limit, page, params, paramsName)
        };
        console.log(data);
        return data;
    },
    //纳新的需求重写参数
    getP1: function (limit, page, params, paramsName) {
        var length = paramsName.length,
          digital = {},
          digitalName,
          p1,
          i;
        for (i = 0; i < length; i++) {
            digitalName = paramsName[i];
            digital[digitalName] = params[digitalName];
        }
        p1 = [digital, limit, page];
        return Ext.encode(p1);
    }
});