//视图
//课程管理
Ext.define('app.view.basis.course.Grid', {
    extend: 'Ext.grid.Panel',
    xtype: 'basisCourseGrid',
    controller: 'basisCourse',
    viewModel: {
        type: 'basisCourse'
    },
    selModel: {
        selType: 'checkboxmodel',
        mode: 'SINGLE'
    },
    bind: '{basisCourseStore}',
    reference: 'basisCourseGrid',
    title: '课程管理',
    dockedItems: [{
        xtype: 'toolbar',
        dock: 'top',
        padding: '8 8 0 12',
        layout: {
            type: 'vbox',
            pack: 'start',
            align: 'stretch'
        },
        items: [{
            xtype: 'container',
            layout: {
                type: 'hbox',
                pack: 'start',
                align: 'stretch'
            },
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
                disabled: true,
                bind: {
                    disabled: '{!basisCourseGrid.selection}'
                }
            }]
        }, {
            xtype: 'container',
            layout: 'column',
            defaults: {
                labelWidth: 60,
                margin: '0 8 8 0',
                msgTarget: 'title'
            },
            items: [{
                width: 190,
                fieldLabel: '课程编码',
                xtype: 'textfield',
                name: 'coding'
            },
            {
                width: 190,
                fieldLabel: '课程名称',
                xtype: 'textfield',
                name: 'name'
            },
            {
                xtype: 'button',
                ui: 'default-toolbar',
                text: '查询',
                handler: 'searchGrid'
            },
            {
                xtype: 'button',
                ui: 'default-toolbar',
                text: '重置',
                handler: 'resetToolbar'
            }]
        }]
    }],
    columns: [{
        dataIndex: 'coding',
        text: '课程编码',
        width: 120
    },
    {
        xtype: 'uxColumn',
        flex: 1,
        dataIndex: 'name',
        text: '课程名称',
        listeners: {
            linkclick: 'onEditClick'
        }
    }]
});