//视图
//会员卡类型删除
Ext.define('app.view.basis.course.Del', {
    extend: 'Ext.window.Window',
    xtype: 'basisCourseDel',
    controller: 'basisCourse',
    autoShow: true,
    bind: '{title}',
    items: [{
        xtype: 'form',
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
            allowBlank: false,
            readOnly:true,
            bind: '{data.coding}'
        },
        {
            xtype: 'textfield',
            name: 'name',
            fieldLabel: '课程名称',
            allowBlank: false,
            readOnly: true,
            bind: '{data.name}'
        },
        {
            xtype: 'textareafield',
            fieldLabel: '删除原因',
            grow:true,
            name: 'remark',
            allowBlank: false
        }]
    }],
    buttons: [{
        text: '确定',
        handler: 'onDel'
    },
    {
        text: '取消',
        handler: 'closeView',
        ui: 'default-toolbar'
    }]
});