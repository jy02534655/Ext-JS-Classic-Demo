//视图
//会员卡类型编辑
Ext.define('app.view.basis.course.Edit', {
    extend: 'Ext.container.Container',
    xtype: 'basisCourseEdit',
    controller: 'basisCourse',
    listeners: {
        //监听视图销毁事件
        //如果修改了却没有保存数据，直接诶返回到列表页
        //我们需要重置数据
        beforedestroy: 'modelReject'
    },
    scrollable: 'y',
    items: [{
        xtype: 'form',
        bind: '{title}',
        bodyPadding: '10 10 0 10',
        fieldDefaults: {
            labelWidth: 70
        },
        items: [{
            xtype: 'hidden',
            name: 'id',
            bind: '{data.id}'
        },
        {
            xtype: 'textfield',
            name: 'coding',
            fieldLabel: '课程编码',
            //自定义验证类型
            vtype: 'serial',
            allowBlank: false,
            bind: {
                value: '{data.coding}',
                //编辑时不可修改
                readOnly: '{isEdit}'
            }
        },
        {
            xtype: 'textfield',
            name: 'name',
            fieldLabel: '课程名称',
            allowBlank: false,
            bind: {
                value: '{data.name}',
                //编辑时不可修改
                readOnly: '{isEdit}'
            }
        },
        {
            xtype: 'textareafield',
            fieldLabel: '备注',
            //自动增长行
            grow:true,
            name: 'remark',
            width: 550,
            bind: '{data.remark}'
        }],
        tbar: [{
            text: '返回',
            handler: 'onBack'
        },
        {
            text: '保存',
            handler: 'onSave',
            ui: 'soft-blue'
        }]
    }]
});