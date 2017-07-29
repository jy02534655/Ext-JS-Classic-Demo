//视图
//空白页
Ext.define('app.view.pages.Blank', {
    extend: 'Ext.container.Container',
    xtype: 'pageblank',
    requires: ['Ext.container.Container'],
    anchor: '100% -1',
    //竖向布局，内容居中显示
    layout: {
        type: 'vbox',
        pack: 'center',
        align: 'center'
    },
    items: [{
        xtype: 'box',
        cls: 'blank-page-container',
        html: '<div class="fa-outer-class"><span class="x-fa fa-clock-o"></span></div><h1>该页面正在建设中!</h1><span class="blank-page-text">请耐心等待</span>'
    }]
});