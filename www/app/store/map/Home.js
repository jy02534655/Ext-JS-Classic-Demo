//数据仓库
//百度地图
Ext.define('app.store.map.Home', {
    extend: 'Ext.data.Store',
    alias: 'store.mapHome',
    model: 'app.model.Map',
    autoLoad: true,
    proxy: {
        type: 'api',
        url: config.map.home
    }
});
