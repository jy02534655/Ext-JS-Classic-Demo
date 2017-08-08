//通用弹窗
Ext.define('app.view.widget.LockingWindow', {
    extend: 'Ext.window.Window',
    xtype: 'lockingwindow',
    cls: 'auth-locked-window',
    titleAlign: 'center',
    maximized: true,
    scrollable: true,
    autoShow: true,
    layout: {
        type: 'vbox',
        align: 'center',
        pack: 'center'
    }
});
