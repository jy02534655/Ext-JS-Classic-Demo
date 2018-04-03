//点击按钮弹出浮动表单层
//可以在里面放置文本框等
//有确定 重置 取消按钮分别对应不同功能
//确定 获取表达内的值并且触发按钮的okclick事件
//取消 隐藏浮动层
//重置 重置表单内容
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
    createPicker: function () {
        var me = this,
            picker, pickerCfg = Ext.apply({
                    xtype: 'form',
                    id: me.id + '-picker',
                    bodyPadding: '20 20 10 20',
                    pickerField: me,
                    //浮动显示
                    floating: true,
                    //默认隐藏
                    hidden: true,
                    //有边框
                    border: true,
                    preventRefocus: true,
                    //给一个标识以便自动遮罩能显示
                    isMask: true,
                    items: me.pickerItems,
                    buttons: [{
                            text: '搜索',
                            handler: function () {
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
                            },
                            ui: 'default-toolbar'
                        }
                    ]
                },
                me.pickerConfig, me.defaultPickerConfig);
        picker = me.picker = Ext.widget(pickerCfg);
        //监听弹出层初始化事件
        picker.on({
            afterrender: 'onPickerAfterrender',
            scope: me
        });
        return picker;
    },
    //弹出层被点击时
    onElClick: function (e) {
        // console.log('onElClick');
        //非INPUT控件点击时不触发后续事件，避免bug
        if (e.target.tagName != 'INPUT') {
            e.stopEvent();
        }
    },
    //弹出层初始化时
    onPickerAfterrender: function () {
        var me = this;
        //监听弹出层点击事件
        me.picker.el.on('mousedown', me.onElClick, me, {
            translate: false
        });
    },

    getValues: function () {
        var picker = this.picker;
        if (picker) {
            return picker.getValues();
        }
        return {};
    }
});