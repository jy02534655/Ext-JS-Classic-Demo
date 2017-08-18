//模拟数据源
//员工待遇
Ext.define('app.data.basis.Pay', {
    extend: 'app.data.Simulated',
    data: {
        data: [{
            text: '试用期',
            checked: true,
            leaf: true,
            id: 40
        },
        {
            text: '福利待遇',
            checked: true,
            id: 10,
            data: [{
                text: '福利',
                checked: true,
                id: 20,
                //注意
                data: [{
                    text: '双休',
                    id: 21,
                    checked: true,
                    leaf: true
                },
                {
                    text: '法定节假日',
                    id: 22,
                    checked: true,
                    leaf: true
                },
                {
                    text: '年假',
                    id: 23,
                    checked: true,
                    leaf: true
                },
                {
                    text: '水果零食',
                    id: 24,
                    leaf: true
                },
                {
                    text: '加班费',
                    id: 25,
                    leaf: true
                },
                {
                    text: '五险一金',
                    id: 26,
                    checked: true,
                    leaf: true
                },
                {
                    text: '餐补',
                    id: 27,
                    checked: true,
                    leaf: true
                },
                {
                    text: '交通补助',
                    id: 28,
                    checked: true,
                    leaf: true
                },
                {
                    text: '工龄工资',
                    id: 29,
                    checked: true,
                    leaf: true
                },
                {
                    text: '话费补贴',
                    id: 30,
                    leaf: true
                },
                {
                    text: '住房补贴',
                    id: 31,
                    leaf: true
                },
                {
                    text: '年终奖',
                    id: 32,
                    checked: true,
                    leaf: true
                }]
            },
            {
                text: '待遇',
                checked: true,
                id: 12,
                data: [{
                    //标题
                    text: '基本工资',
                    id: 1,
                    checked: true,
                    leaf: true
                },
                {
                    text: '绩效',
                    leaf: true,
                    id: 121
                },
                {
                    text: '定时调薪',
                    checked: true,
                    leaf: true,
                    id: 122
                },
                {
                    text: '保密费',
                    leaf: true,
                    id: 123
                }]
            }]
        },
        {
            text: '规定',
            id: 31,
            data: [{
                text: '着装限制',
                leaf: true,
                id: 32
            },
            {
                text: '网络限制',
                leaf: true,
                id: 33
            }]
        }]
    }
});