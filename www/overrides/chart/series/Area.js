//重写类 折线图 area
Ext.define("override.chart.series.Area", {
    override: "Ext.chart.series.Area",
    //样式
    style: {
        opacity: 0.4
    },
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