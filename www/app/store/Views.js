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
        //是否window弹窗
        name: 'isWindow',
        type: 'boolean',
        defaultValue: true
    }]
});