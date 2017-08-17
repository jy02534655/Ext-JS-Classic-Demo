//视图
//会员级别
Ext.define('app.view.basis.level.Grid', {
    extend: 'Ext.grid.Panel',
    xtype: 'basisLevelGrid',
    controller: 'basisLevel',
    rrequires: ['ux.button.Search'],
    viewModel: {
        type: 'basisLevel'
    },
    selModel: {
        selType: 'checkboxmodel',
        //单选
        mode: 'SINGLE'
    },
    bind: '{basisLevelStore}',
    reference: 'basisLevelGrid',
    title: '会员级别',
    dockedItems: [{
        xtype: 'toolbar',
        dock: 'top',
        items: [{
            text: '新增',
            handler: 'onAddClick',
            disabled: true,
            bind: {
                disabled: '{!categoryTree.selection}'
            }
        },
        {
            text: '删除',
            handler: 'onDeleteClick',
            disabled: true,
            bind: {
                disabled: '{!basisLevelGrid.selection}'
            }
        },
        '->', {
            xtype: 'buttonSearch',
            text: '筛选',
            pickerAlign: 'tr-b',
            pickerOffset: [35, 5],
            listeners: {
                okclick: 'onGridSearchByBtn'
            },
            pickerConfig: {
                fieldDefaults: {
                    labelWidth: 40
                }
            },
            //筛选项
            //和form表单中items配置一样
            pickerItems: [{
                fieldLabel: '编码',
                xtype: 'textfield',
                allowBlank: false,
                name: 'coding'
            },
            {
                fieldLabel: '名称',
                xtype: 'textfield',
                name: 'type'
            }]
        }]
    }],
    columns: [{
        dataIndex: 'coding',
        text: '编码',
        width: 120
    },
    {
        xtype: 'uxColumn',
        flex: 1,
        dataIndex: 'type',
        text: '名称',
        listeners: {
            linkclick: 'onEditClick'
        }
    }]
});