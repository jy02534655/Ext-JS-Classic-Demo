//模型
//导航菜单
Ext.define('app.model.Navigation', {
    extend: 'Ext.data.TreeModel',
    //引入自定义代理,注意每新增一个自定义扩展都需要引入并编译一下项目才能起作用
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
    },
    {
        name: 'pageType'
    }],
    //代理
    proxy: {
        //代理类型
        type: 'api',
        //请求地址
        url: config.user.navigation
    }
});