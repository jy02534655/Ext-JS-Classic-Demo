//模拟数据源
//员工统计
Ext.define('app.data.report.Employee', {
    extend: 'app.data.Simulated',
    data: {
        data: [{
            id: 1,
            name: '管理层',
            count: '5'
        },
        {
            id: 2,
            name: '研发',
            count: '40'
        },
        {
            id: 3,
            name: '产品',
            count: '5'
        },
        {
            id: 4,
            name: '销售',
            count: '10'
        }]
    }
});