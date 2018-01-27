//视图
//首页
Ext.define('app.view.echart.Home', {
    extend: 'Ext.container.Container',
    xtype: 'echartHome',
    controller: 'echart',
    //指定视图数据源
    viewModel: {
        type: 'echart'
    },
    scrollable: 'y',
    padding: 10,
    items: [{
            margin: '20 0',
            height: 370,
            title: '销量统计',
            border: true,
            items: [{
                xtype: 'echartSales',
                bind: {
                    store: '{echartSalesStore}'
                }
            }]
        },
        {
            margin: '20 0',
            height: 370,
            title: '市场占有率（柱状图）',
            border: true,
            items: [{
                xtype: 'echartShareHistogram',
                bind: {
                    store: '{echartShareStore}'
                }
            }]
        },
        {
            margin: '20 0',
            xtype: 'container',
            layout: 'hbox',
            defaults:{
                border: true,
                height: 370
            },
            items: [{
                    margin: '0 10 0 0',
                    flex: 2,
                    title: '市场占有率(折线图)',
                    items: [{
                        xtype: 'echartShare',
                        bind: {
                            store: '{echartShareStore}'
                        }
                    }]
                },
                {
                    flex: 1,
                    title: '员工统计',
                    items: [{
                        xtype: 'echartEmployee',
                        bind: {
                            store: '{echartEmployeeStore}'
                        }
                    }]
                }
            ]
        }
    ]
});