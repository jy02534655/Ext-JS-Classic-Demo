//点击按钮弹出查询条件
Ext.define('ux.button.Search', {
    extend: 'ux.button.Picker',
    xtype: 'buttonSearch',
    //弹窗默认配置
    defaultPickerConfig: {
        maxHeight: 300,
        shadow: 'sides'
    },
    //Picker内容配置
    pickerItems: [],
    //创建弹窗
    createPicker: function () {
        var me = this,
        picker, pickerCfg = Ext.apply({
            xtype: 'form',
            id: me.id + '-picker',
            bodyPadding: '20 20 10 20',
            pickerField: me,
            floating: true,
            hidden: true,
            border: true,
            preventRefocus: true,
            //给一个标识以便自动遮罩能显示
            isMask:true,
            items: me.pickerItems,
            buttons: [{
                text: '确定',
                handler: function (t) {
                    var form = me.getPicker();
                    if (form.isValid()) {
                        me.fireEvent('okclick', me, form, form.getValues());
                        me.collapse();
                    }
                }
            },
            {
                text: '取消',
                handler: function () {
                    me.collapse();
                }
            }, '->', {
                text: '重置',
                handler: function () {
                    me.picker.reset();
                }
            }]
        },
        me.pickerConfig, me.defaultPickerConfig);
        picker = me.picker = Ext.widget(pickerCfg);
        return picker;
    },
    getValues: function () {
        var picker = this.picker;
        if (picker) {
            return picker.getValues();
        }
        return {};
    }
});