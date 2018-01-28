//重写类 表单父类
//支持allowBlank动态绑定
//支持vtype动态绑定
Ext.define('override.form.field.Base', {
    override: 'Ext.form.field.Base',
    //标签文字右对齐
    labelAlign: 'right',
    setAllowBlank: function (value) {
        var me = this,
            label = me.fieldLabel;
        me.allowBlank = value;
        //过滤掉空格字符
        if (label) {
            label = label.replace('<font color=red>*</font>', '');
        }
        //如果不验证必填项，执行一下验证方法用来去掉警告
        if (value) {
            me.isValid();
            //labelSeparator存在才标红
        } else if (label && me.labelSeparator) {
            //标红
            label = '<font color=red>*</font>' + label;
        }
        me.setFieldLabel(label);
    },
    setVtype: function (value) {
        this.vtype = value;
        if (this.getValue()) {
            this.isValid();
        }
    }
});