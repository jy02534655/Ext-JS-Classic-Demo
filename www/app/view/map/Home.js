//视图
//首页
Ext.define('app.view.map.Home', {
    extend: 'ux.map.Base',
    xtype: 'mapHome',
    controller: 'map',
    //指定视图数据源
    viewModel: {
        type: 'map'
    },
    listeners: {
        showMap: 'onShowMap'
    },
    bind: {
        store: '{mapHomeStore}'
    }
});