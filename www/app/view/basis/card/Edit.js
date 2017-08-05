//视图
//会员卡类型编辑
Ext.define('app.view.basis.card.Edit', {
    extend: 'Ext.window.Window',
    xtype: 'basisCardEdit',
    controller: 'basisCard',
    //动态绑定标题
    bind: '{title}',
    //自动显示
    autoShow: true,
    items: [{
        xtype: 'form',
        bodyPadding: '10 10 0 10',
        fieldDefaults: {
            labelWidth: 80
        },
        items: [{
            //隐藏域
            //编辑时需要
            xtype: 'hidden',
            name: 'id',
            //绑定数据，用于编辑时显示编辑数据
            bind: '{data.id}'
        },
        {
            xtype: 'textfield',
            name: 'coding',
            fieldLabel: '会员卡编码',
            //验证类型
            vtype: 'alphanum',
            //必填项
            allowBlank: false,
            bind: '{data.coding}'
        },
        {
            xtype: 'textfield',
            name: 'type',
            fieldLabel: '会员卡名称',
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
        //关闭弹窗，需要重置模型数据
        handler: 'onWindowChange',
        ui: 'default-toolbar'
    }]
});