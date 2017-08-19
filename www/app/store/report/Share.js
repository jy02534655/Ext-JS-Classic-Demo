//数据仓库
//市场占有率
Ext.define('app.store.report.Share', {
    extend: 'Ext.data.Store',
    alias: 'store.reportShare',
    model: 'app.model.report.Share',
    autoLoad: true,
    proxy: {
        type: 'api',
        url: config.report.share
    }
});
