//数据仓库
//视图白名单
//有些视图不需要显示在导航菜单中，可以配置在这里
Ext.define('app.store.Views', {
    extend: 'Ext.data.Store',
    alias: 'store.views',
    fields: [{
        name: 'viewType',
        type: 'string'
    },
    {
        //一个标识，标识切换视图时不需要选中左侧菜单栏
        name: 'isOther',
        type: 'boolean',
        defaultValue: true
    }],
    data: [{
        viewType: 'faq'
    }, {
        viewType:'login'
    }, {
        viewType: 'register'
    }, {
        viewType: 'passwordreset'
    }, {
        viewType: 'userlock'
    }]
});