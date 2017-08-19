//视图
//销量
Ext.define('app.view.report.Sales', {
    extend: 'Ext.chart.CartesianChart',
    requires: ['Ext.chart.series.Bar', 'Ext.chart.axis.Numeric', 'Ext.chart.axis.Category'],
    xtype: 'reportSales',
    height: 370,
    insetPadding: '30 50 30 30',
    border: true,
    colors: ['#99CCFF'],
    axes: [{
        type: 'numeric',
        position: 'left',
        //设置为0就不会出现小数点
        majorTickSteps: 0
    }, {
        type: 'category',
        position: 'bottom'
    }],
    series: {
        type: 'bar',
        xField: 'date',
        yField: 'count',
        label: {
            field: 'count',
            display: 'insideEnd',
            orientation: 'horizontal',
            renderer: function (value) {
                return value + '课时';
            }
        }
    }
});
