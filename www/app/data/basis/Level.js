//模拟数据源
//员工级别
Ext.define('app.data.basis.Level', {
    extend: 'app.data.Simulated',
    data: {
        data: [{
            id: 1,
            coding: 'kaifa001',
            type: 'P1'
        },
        {
            id: 2,
            coding: 'kaifa002',
            type: 'P2'
        },
        {
            id: 3,
            coding: 'kaifa003',
            type: 'P3'
        }]
    }
});