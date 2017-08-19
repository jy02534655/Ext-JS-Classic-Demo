//视图
//会员级别
Ext.define('app.view.basis.level.Grid', {
    extend: 'Ext.grid.Panel',
    xtype: 'basisLevelGrid',
    controller: 'basisLevel',
    //引入扩展
    requires: ['ux.button.Search'],
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
        defaults: {
            xtype: 'button',
            disabled: true,
            ui: 'soft-blue'
        },
        items: [{
            text: '新增',
            handler: 'onAddClick',
            bind: {
                disabled: '{!categoryTree.selection}'
            }
        },
        {
            text: '删除',
            handler: 'onDeleteClick',
            bind: {
                disabled: '{!basisLevelGrid.selection}'
            }
        },
        {
            text: '设置待遇',
            handler: 'onPlayClick',
            bind: {
                disabled: '{!basisLevelGrid.selection}'
            }
        },
        '->', {
            xtype: 'buttonSearch',
            text: '筛选',
            //浮动位置
            pickerAlign: 'tr-b',
            //浮动偏移量
            pickerOffset: [35, 5],
            listeners: {
                okclick: 'onGridSearchByBtn'
            },
            //弹窗配置
            pickerConfig: {
                fieldDefaults: {
                    labelWidth: 40
                }
            },
            //筛选项
            //和form表单中items配置一样
            pickerItems: [{
                //隐藏域
                xtype: 'hidden',
                name: 'categoryId',
                //左侧树形菜单选中项的id
                bind: '{categoryTree.selection.id}'
            }, {
                fieldLabel: '编码',
                xtype: 'textfield',
                allowBlank: false,
                name: 'coding'
            },
            {
                fieldLabel: '名称',
                xtype: 'textfield',
                name: 'type'
            }],
            disabled: true,
            bind: {
                disabled: '{!categoryTree.selection}'
            }
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