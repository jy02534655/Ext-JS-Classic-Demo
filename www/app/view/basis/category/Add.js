//视图
//新增员工类型
Ext.define('app.view.basis.category.Add', {
    extend: 'Ext.form.Panel',
    xtype: 'basisCategoryAdd',
    controller: 'basisCategory',
    title: '新增',
    bodyPadding: '0 10 10 10',
    border: true,
    fieldDefaults: {
        labelWidth: 90
    },
    listeners: {
        treeSelect: 'onAddSelection'
    },
    items: [{
        xtype: 'textfield',
        fieldLabel: '上级名称',
        allowBlank: false,
        readOnly: true,
        bind: '{data.parentName}'
    },
    {
        xtype: 'textfield',
        fieldLabel: '名称',
        allowBlank: false,
        name: 'text',
        maxLength: 20
    },
    {
        xtype: 'textareafield',
        fieldLabel: '备注',
        name: 'remark',
        width: 550
    }],
    tbar: [{
        text: '返回',
        handler: 'onBack'
    },
    {
        text: '保存',
        handler: 'onAddSave',
        ui: 'soft-blue'
    }]
});