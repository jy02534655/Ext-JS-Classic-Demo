//自定义代理
//全局通用代理
Ext.define('ux.proxy.API', {
    extend: 'Ext.data.proxy.Ajax',
    alias: 'proxy.api',
    //请求头信息
    headers: {
        'Content-Type': 'application/json;charset=UTF-8'
    },
    //分页每页显示条数字段名称，默认为limit，此参数传递到服务端
    limitParam: 'limit',
    //分页页码字段名称，默认为page，此参数传递到服务端
    pageParam: 'page',
    //读取数据
    reader: {
        //数据类型
        type: 'json',
        //服务端返回数据集数据源字段名称，用于指定数据源，可以不指定默认值为‘’
        rootProperty: 'data',
        //服务端返回数据集数据总数字段名称，用于分页，默认值为total
        totalProperty: 'total',
        //服务端返回消息提示字段名称，用于分页，默认值为‘’
        messageProperty: 'message',
        //服务端返回操作结果字段名称，用于分页，默认值为success，只能是true或者false
        successProperty: 'success'
        //如果服务端满足的数据不是标准的数据
        //例如没有给success字段，但是给了状态码，可以在里面写一些逻辑处理成代理想要的数据
        //transform: function (data) {
        //    console.log('服务端返回数据:', data);
        //    return data;
        //}
    },
    //请求时
    writer: {
        //传值时传递模型所有的字段
        writeAllFields: true,
        //所有请求的数据会用data包起来，仅限于post
        rootProperty: 'data'
        //纳新的需求重写参数
        //,transform: function (data, t) {
        //    var proxy = t.getProxy();
        //    return Ext.applyIf(data, util.neuropathyData(proxy.ajaxName, 1, 1, data, proxy.paramsName));;
        //}
    }
});