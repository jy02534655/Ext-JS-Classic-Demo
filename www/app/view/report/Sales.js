//视图
//销量统计
Ext.define('app.view.report.Sales', {
    extend: 'Ext.chart.CartesianChart',
    requires: ['Ext.chart.series.Bar', 'Ext.chart.axis.Numeric', 'Ext.chart.axis.Category'],
    xtype: 'reportSales',
    height: 370,
    insetPadding: '30 50 30 30',
    border: true,
    //图表的轴
    axes: [{
        //左侧轴
        type: 'numeric',
        position: 'left',
        //设置为0就不会出现小数点
        majorTickSteps: 0
    }, {
        //下方轴
        type: 'category',
        position: 'bottom'
    }],
    series: {
        //柱状图
        type: 'bar',
        //x轴数据字段名称
        xField: 'date',
        //y轴数据字段名称
        yField: 'count',
        //文字
        label: {
            //值字段名称
            field: 'count',
            display: 'insideEnd',
            orientation: 'horizontal',
            //显示处理
            renderer: function (value) {
                return value + '课时';
            }
        }
    }
});
