//模拟数据源
//会员卡类型
Ext.define('app.data.basis.Card', {
    extend: 'app.data.Simulated',
    data: {
        data: [{
            id: 1,
            coding: 'YK_001',
            type: '年卡'
        },
        {
            id: 2,
            coding: 'MK_001',
            type: '月卡'
        },
        {
            id: 3,
            coding: 'Dk_001',
            type: '日卡'
        }]
    }
});