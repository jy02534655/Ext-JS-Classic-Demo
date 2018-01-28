//重写类 消息提示
Ext.define('override.window.Toast', {
    override: 'Ext.window.Toast',
    //不能一直在最上传，会影响自动遮罩效果
    alwaysOnTop: false,
    //修正window弹窗重写配置
    modal: false
});