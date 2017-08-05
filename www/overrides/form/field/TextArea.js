//重写类 多行文本框
//输入长度限制
Ext.define("override.form.field.TextArea", {
    override: "Ext.form.field.TextArea",
    maxLength: 500
});