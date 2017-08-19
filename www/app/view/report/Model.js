//数据源
//员工类型容器数据源
Ext.define('app.view.report.Model', {
    extend: 'Ext.app.ViewModel',
    alias: 'viewmodel.report',
    stores: {
        //员工统计
        reportEmployeeStore: {
            type: 'reportEmployee'
        },
        //销量
        reportSalesStore: {
            type: 'reportSales'
        },
        //市场占有率
        reportShareStore: {
            type: 'reportShare'
        },
    }
});
