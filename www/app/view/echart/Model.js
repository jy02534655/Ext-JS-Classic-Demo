//数据源
//统计报表数据源
Ext.define('app.view.echart.Model', {
    extend: 'Ext.app.ViewModel',
    alias: 'viewmodel.echart',
    stores: {
        //员工统计
        echartEmployeeStore: {
            type: 'reportEmployee'
        },
        //销量
        echartSalesStore: {
            type: 'reportSales'
        },
        //市场占有率
        echartShareStore: {
            type: 'reportShare'
        }
    }
});
