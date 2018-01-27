//视图
//员工统计
Ext.define('app.view.echart.Employee', {
    extend: 'ux.echart.Pie',
    xtype: 'echartEmployee',
    config: {
        //配置项，参考百度图表对应配置
        legend: [{
            bottom: 10,
            itemWidth: 12,
            itemHeight: 10
        }],
        //显示名称字段名称
        nameField: 'name',
        //值字段名称
        valueField: 'count',
        //配置项，参考百度图表对应配置
        option: [{
            tooltip: {
                position: ['50%', 10],
                trigger: 'item',
                formatter: '{b}<br/>{c}({d}%)'
            }
        }],
        //配置项，参考百度图表对应配置
        pie: [{
            labelLine: {
                normal: {
                    length: 5,
                    length2: 5
                }
            }
        }]
    }
});