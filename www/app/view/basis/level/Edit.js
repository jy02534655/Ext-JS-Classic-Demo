//视图
//会员级别编辑
Ext.define('app.view.basis.level.Edit', {
    extend: 'Ext.window.Window',
    xtype: 'basisLevelEdit',
    controller: 'basisLevel',
    bind: '{title}',
    autoShow: true,
    items: [{
        xtype: 'form',
        bodyPadding: '10 10 0 10',
        fieldDefaults: {
            labelWidth: 40
        },
        items: [{
            xtype: 'hidden',
            name: 'id',
            bind: '{data.id}'
        },
        {
            xtype: 'textfield',
            name: 'coding',
            fieldLabel: '编码',
            vtype: 'alphanum',
            allowBlank: false,
            bind: '{data.coding}'
        },
        {
            xtype: 'textfield',
            name: 'type',
            fieldLabel: '名称',
            allowBlank: false,
            bind: '{data.type}'
        }]
    }],
    buttons: [{
        text: '保存',
        handler: 'onSave'
    },
    {
        text: '取消',
        handler: 'onWindowChange',
        ui: 'default-toolbar'
    }]
});