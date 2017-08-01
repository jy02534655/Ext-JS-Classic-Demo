//重写类 文本框
//输入长度限制
//必填项自动标红加*
//如果是string类型则清除前后空格
//修改必填项错误提示，提示更直观
Ext.define("override.form.field.Text", {
    override: "Ext.form.field.Text",
    invalidText: '输入内容无效',
    minLengthText: '最少输入{0}个字',
    maxLengthText: '最多输入{0}个字',
    blankText: '此项为必填项',
    //设置提示信息在文本框下方显示
    msgTarget: 'under',
    //默认最大长度限制
    maxLength: 100,
    //输入过滤
    maskRe: /[_ %-@.a-zA-Z0-9\u4e00-\u9fa5]/,
    initComponent: function () {
        var me = this,
           label;
        me.callParent(arguments);
        if (me.fieldLabel) {
            label = me.fieldLabel.replace('<font color=red>*</font>', '');
            //必填项自动标红加*
            if (me.allowBlank === false && me.labelSeparator) {
                me.fieldLabel = '<font color=red>*</font>' + label;
            }
            //过滤掉空格字符
            label = label.replace(/&..sp;/g, '');
            //只针对输入控件
            //不能是tagfield控件，否则会引发空值时弹出框不能隐藏bug
            if (!me.emptyText && !me.isPickerField) {
                //自动设置空值提示
                me.emptyText = '请输入' + label;
            }
            if (me.blankText == '此项为必填项') {
                //自动设置必填提示
                me.blankText = label + '为必填项';
            }
        }
    },
    //取值时自动清除前后空格
    getRawValue: function () {
        var me = this,
            v = me.callParent();
        if (v === me.emptyText && me.valueContainsPlaceholder) {
            v = '';
        }
        //如果是string类型并且不是密码控件则清除前后空格
        if (v && Ext.isString(v) && me.inputType != 'password') {
            v = v.trim();
        }
        return v;
    },
    //重置值时支持重置为指定的值
    reset: function () {
        var defaultValue = this.defaultValue;
        if (defaultValue) {
            this.setValue(defaultValue);
        } else {
            this.callParent(arguments);
        }
    }
});