//视图
//销量统计
Ext.define('app.view.echart.Sales', {
    extend: 'ux.echart.Series',
    xtype: 'echartSales',
    config: {
        //配置项，参考百度图表对应配置
        //option:[{key:value}]
        option: [{
            grid: {
                left: '60',
                bottom: '40',
                top: '50',
                right: '40'
            }
        }],
        //展示内容配置
        series: [{
            name: '人数',
            //标注
            markPoint: {
                data: [{
                    //最大值
                    type: 'max'
                }]
            },
            label: {
                normal: {
                    show: true
                }
            }
        }],
        //x轴数据对应字段
        xField: 'date',
        //y轴数据对应字段
        yField: 'count'
    }
});