//视图
//员工级别——待遇设置
Ext.define('doordu.view.basis.level.Pay', {
    extend: 'Ext.window.Window',
    xtype: 'levelPay',
    requires: ['ux.tree.ColumnChecked', 'ux.tree.ColumnNoChecked'],
    controller: 'basisLevel',
    listeners: {
        //使用show事件不影响自动遮罩效果
        show: 'onPayShow'
    },
    autoShow: true,
    title: '待遇设置',
    bind: '待遇设置:' + '{data.type}',
    items: [{
        xtype: 'treepanel',
        height: 400,
        width: 500,
        bind: '{payStore}',
        //箭头风格
        useArrows: true,
        //隐藏总结点
        rootVisible: false,
        columns: [{
            xtype: 'uxColumnChecked',
            //禁止拖动
            resizable: false,
            //禁止排序
            sortable: false,
            header: '分配待遇',
            width: 80
        },
        {
            xtype: 'uxColumnNoChecked',
            header: '待遇',
            resizable: false,
            sortable: false,
            dataIndex: 'text',
            flex: 1
        }]
    }],
    buttons: [{
        text: '保存',
        handler: 'onSavePay'
    },
    {
        text: '取消',
        handler: 'closeView',
        ui: 'default-toolbar'
    }]
});