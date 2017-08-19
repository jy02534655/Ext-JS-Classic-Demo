//视图
//首页
Ext.define('app.view.report.Home', {
    extend: 'Ext.container.Container',
    xtype: 'reportHome',
    controller: 'report',
    //指定视图数据源
    viewModel: {
        type: 'report'
    },
    scrollable: 'y',
    padding: 10,
    items: [{
        margin: '20 0',
        xtype: 'reportSales',
        bind: '{reportSalesStore}',
        title: '销量统计'
    },
    {
        margin: '20 0',
        xtype: 'container',
        layout: 'hbox',
        items: [{
            flex: 2,
            margin: '0 10 0 0',
            xtype: 'reportShare',
            bind: '{reportShareStore}',
            title: '市场占有率'
        },
        {
            flex: 1,
            title: '员工统计',
            bind: '{reportEmployeeStore}',
            xtype: 'reportEmployee'
        }]
    }]
});