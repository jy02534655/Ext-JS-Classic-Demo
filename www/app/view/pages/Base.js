//视图
//弹窗基础类
Ext.define('app.view.pages.Base', {
    extend: 'Ext.window.Window',
    //引入类
    requires: ['Ext.toolbar.Spacer'],
    //自动显示
    autoShow: true,
    //cls
    cls: 'base-page-container',
    //隐藏关闭按钮
    closable: false,
    //最大化显示
    maximized: true,
    //模态窗口
    modal: true,
    //标题
    title: '提示',
    //标题居中显示
    titleAlign: 'center',
    //布局
    layout: {
        type: 'vbox',
        align: 'center',
        pack: 'center'
    }
});