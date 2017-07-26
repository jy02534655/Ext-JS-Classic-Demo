//视图
//空白页
Ext.define('app.view.pages.Blank', {
    extend: 'Ext.container.Container',
    xtype: 'pageblank',
    requires: [
        'Ext.container.Container'
    ],
    padding:10,
    html: '空白页'
});
