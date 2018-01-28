//重写类 验证类
//自定义验证
Ext.define('override.form.field.VTypes', {
    override: 'Ext.form.field.VTypes',
    //验证方法
    serial: function (value) {
        return this.serialRe.test(value);
    },
    //验证正则
    serialRe: /^[a-zA-Z\d]+$/,
    //验证提示
    serialText: '只能输入数字或字母'
});