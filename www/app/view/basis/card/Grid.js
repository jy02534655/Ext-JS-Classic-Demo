//视图
//会员卡类型
Ext.define('app.view.basis.card.Grid', {
    extend: 'Ext.grid.Panel',
    xtype: 'basisCardGrid',
    //引入自适应布局
    //引入自定义控制器类
    //引入消息提示类
    requires: ['Ext.layout.container.Column', 'ux.app.ViewController', 'Ext.window.Toast'],
    //指定视图控制器
    controller: 'basisCard',
    //指定视图数据源
    viewModel: {
        type: 'basisCard'
    },
    selModel: {
        selType: 'checkboxmodel',
        //单选
        mode: 'SINGLE'
    },
    //绑定数据源
    bind: '{basisCardStore}',
    //引用名称
    //可以在控制层通过this.lookup('basisCardGrid')获取到该视图
    //也可以通过bind来做一些数据绑定操作
    reference: 'basisCardGrid',
    //标题
    title: '会员卡类型',
    dockedItems: [{
        //边栏
        xtype: 'toolbar',
        //位于顶部
        dock: 'top',
        padding: '8 8 0 12',
        layout: {
            type: 'vbox',
            pack: 'start',
            align: 'stretch'
        },
        items: [{
            xtype: 'container',
            //横向布局
            layout: {
                type: 'hbox',
                pack: 'start',
                align: 'stretch'
            },
            //子项默认配置
            defaults: {
                xtype: 'button',
                margin: '0 10 8 0'
            },
            items: [{
                text: '新增',
                handler: 'onAddClick'
            },
            {
                text: '删除',
                handler: 'onDeleteClick',
                //默认禁用
                disabled: true,
                bind: {
                    //列表有行被选中时启用
                    disabled: '{!basisCardGrid.selection}'
                }
            }]
        }, {
            xtype: 'container',
            //自适应布局
            layout: 'column',
            //默认配置
            defaults: {
                //文本宽度
                labelWidth: 71,
                //margin
                margin: '0 8 8 0',
                //错误提醒方式
                msgTarget: 'title'
            },
            items: [{
                //输入框宽度固定为130，加文本宽度总宽度就是201
                width: 201,
                fieldLabel: '会员卡编码',
                //文本框
                xtype: 'textfield',
                name: 'coding'
            },
            {
                width: 201,
                fieldLabel: '会员卡类型',
                xtype: 'textfield',
                name: 'type'
            },
            {
                //查询按钮
                xtype: 'button',
                ui: 'default-toolbar',
                text: '查询',
                //点击按钮触发的事件
                //searchGrid是一个通用查询方法
                //只要在toolbar定义了name的输入框的值都会传递到服务端以便服务端用来实现查询功能
                handler: 'searchGrid'
            },
            {
                //重置查询条件按钮
                xtype: 'button',
                ui: 'default-toolbar',
                text: '重置',
                //resetToolbar是一个通用重置查询条件方法
                handler: 'resetToolbar'
            }]
        }]
    }],
    //列配置
    columns: [{
        //对应列表数据的字段名称
        dataIndex: 'coding',
        //列头
        text: '会员卡类型编码',
        width: 120
    },
    {
        //自定义控件
        //使这一列可以被点击
        xtype: 'uxColumn',
        //铺满剩余宽度
        flex: 1,
        dataIndex: 'type',
        text: '会员卡类型',
        listeners: {
            //监听点击事件
            linkclick: 'onEditClick'
        }
    }]
});