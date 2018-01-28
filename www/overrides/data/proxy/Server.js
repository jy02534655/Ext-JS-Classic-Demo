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
        //Ext.applyIf(params, me.neuropathyData(me.ajaxName, params[me.getLimitParam()], params[me.getPageParam()], me.getExtraParams()));
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
    //值适用于查询
    //name就是p0要传的值，对应代理里面的自定义配置ajaxName
    //limit 每页页数 无须配置，调用方法时自动取值
    //page 页码 无须配置，调用方法时自动取值
    //params 查询条件 无须配置，调用util.storeLoad()方法后会自动取值
    neuropathyData: function (name, limit, page, params) {
        if (!name) {
            return {};
        }
        var data = {
            p0: name,
            p1: this.getP1(limit, page, params)
        };
        return data;
    },
    //纳新的需求重写参数
    getP1: function (limit, page, params) {
        var data = [];
        data.push(params);
        if (page && limit) {
            data.push(page);
            data.push(limit);
        }
        return Ext.encode(data);
    }
});