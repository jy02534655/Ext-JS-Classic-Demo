//重写类 折线图 Line
Ext.define('override.chart.series.Line', {
    override: 'Ext.chart.series.Line',
    //标记点
    marker: {
        opacity: 1,
        radius: 2,
        lineWidth: 2
    },
    highlight: {
        fillStyle: '#000',
        radius: 3,
        lineWidth: 2,
        strokeStyle: '#fff'
    },
    tooltip: {
        trackMouse: true
    }
});