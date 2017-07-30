//模型
//导航菜单
Ext.define('app.model.Navigation', {
    extend: 'Ext.data.TreeModel',
    //引入自定义代理
    requires: ['ux.proxy.API'],
    fields: [{
        name: 'text'
    },
    {
        name: 'iconCls'
    },
    {
        name: 'viewType'
    },
    {
        name: 'leaf'
    }],
    //代理
    proxy: {
        //代理类型
        type: 'api',
        //请求地址
        url: config.user.navigation
    }
});