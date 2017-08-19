//视图控制器
//统计报表
Ext.define('app.view.report.Controller', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.report',
    //折线图移动到点上处理
    onShareRenderer: function (tooltip, record, item) {
        if (record) {
            var title = item.series.getTitle();
            tooltip.setHtml(record.get('date') + '</br>' + title + ':' + record.get(item.series.getYField()) + '%');
        }
    }
});
