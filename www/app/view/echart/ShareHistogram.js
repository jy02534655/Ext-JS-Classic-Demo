//视图
//市场占有率柱状图
Ext.define('app.view.echart.ShareHistogram', {
    extend: 'ux.echart.Series',
    xtype: 'echartShareHistogram',
    config: {
        //配置项，参考百度图表对应配置
        option: [{
            grid: {
                left: '60',
                bottom: '60',
                top: '50',
                right: '40'
            },

        }],
        //配置项，参考百度图表对应配置
        legend: [{
            bottom: 10,
            itemWidth: 12,
            itemHeight: 10
        }],
        //展示内容配置
        series: [{
                name: '普拉提',
                type: 'bar',
                itemStyle: {
                    normal: {
                        color: '#00aeff'
                    }
                }
            },
            {
                name: '颈椎操',
                type: 'bar',
                itemStyle: {
                    normal: {
                        color: '#4372e2'
                    }
                }
            },
            {
                name: '小燕飞',
                type: 'bar',
                itemStyle: {
                    normal: {
                        color: '#ffa800'
                    }
                }
            }
        ],
        //x轴数据对应字段
        xField: 'date',
        //y轴数据对应字段
        yField: ['plt', 'jzc', 'xyf']
    }
});