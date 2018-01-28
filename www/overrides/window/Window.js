//重写类 Window弹窗
//禁止改变大小
//禁止拖动
Ext.define('override.window.Window', {
    override: 'Ext.window.Window',
    //汉化配置
    closeToolText: '关闭',
    //一直在最上层，否则会影响自动遮罩效果
    alwaysOnTop: true,
    //隐藏关闭按钮
    closable: false,
    //模态窗口
    modal: true,
    //禁止改变大小
    resizable: false,
    shadow: false
});