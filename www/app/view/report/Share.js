//视图
//市场占有率
Ext.define('app.view.report.Share', {
    extend: 'Ext.chart.CartesianChart',
    requires: ['Ext.chart.legend.Legend', 'Ext.chart.series.Area'],
    xtype: 'reportShare',
    height: 370,
    insetPadding: '30 40 0 30',
    border: true,
    legend: {
        type: 'dom',
        cls: 'bb bl br',
        padding: '0 0 5 0'
    },
    axes: [{
        type: 'numeric',
        position: 'left',
        fields: ['plt', 'jzc', 'xyf'],
        renderer: function (axis, label, layoutContext) {
            if (parseInt(label) == label && label > 0) {
                return label + '%';
            }
            return '';
        }
    },
    {
        type: 'category',
        fields: 'date',
        position: 'bottom'
    }],
    //多个折线配置
    series: [{
        type: 'area',
        title: '普拉提',
        xField: 'date',
        yField: 'plt',
        //移动到点上显示处理
        tooltip: {
            renderer: 'onShareRenderer'
        }
    },
    {
        type: 'area',
        title: '颈椎操',
        xField: 'date',
        yField: 'jzc',
        tooltip: {
            renderer: 'onShareRenderer'
        }
    },
    {
        type: 'area',
        title: '小燕飞',
        xField: 'date',
        yField: 'xyf',
        tooltip: {
            renderer: 'onShareRenderer'
        }
    }]
});