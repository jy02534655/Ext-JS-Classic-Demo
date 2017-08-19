//数据仓库
//销量统计
Ext.define('app.store.report.Sales', {
    extend: 'Ext.data.Store',
    alias: 'store.reportSales',
    model: 'app.model.report.Sales',
    autoLoad: true,
    proxy: {
        type: 'api',
        url: config.report.sales
    }
});
