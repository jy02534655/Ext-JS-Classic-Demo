//数据仓库
//员工统计
Ext.define('app.store.report.Employee', {
    extend: 'Ext.data.Store',
    alias: 'store.reportEmployee',
    model: 'app.model.report.Employee',
    autoLoad: true,
    proxy: {
        type: 'api',
        url: config.report.employee
    }
});
