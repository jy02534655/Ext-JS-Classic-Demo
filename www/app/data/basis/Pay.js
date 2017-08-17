//模拟数据源
//员工待遇
Ext.define('app.data.basis.Pay', {
    extend: 'app.data.Simulated',
    data: {
        data: [{
            //标题
            text: '基本工资',
            id: 1,
            leaf: true
        },
        {
            text: '福利',
            id: 10,
            remark:'我是一个小开发~',
            data: [{
                text: '前端',
                leaf: true,
                remark: '有锅甩给产品就好',
                id: 11
            },
            {
                text: '后端',
                id: 12,
                remark: '有锅甩给产品就好',
                data: [{
                    text: 'java',
                    leaf: true,
                    remark: '有锅甩给产品就好',
                    id: 121
                }, {
                    text: 'PHP',
                    leaf: true,
                    remark: '有锅甩给产品就好',
                    id: 122
                }]
            },
            {
                text: 'DB',
                remark: '有锅甩给运维就好',
                id: 13,
                leaf: true
            }]
        },
        {
            text: '上班时间',
            remark: '有锅甩给运维就好',
            id: 20,
            //注意
            data: [{
                text: 'UI',
                remark: '我的锅甩给谁呢？',
                id: 21,
                leaf: true
            },
            {
                text: '产品经理',
                remark: '有锅甩给销售就好',
                id: 22,
                leaf: true
            }]
        }, {
            text: '五险一金',
            remark: '卖卖卖！！！',
            id: 30,
            leaf: true
        }]
    }
});