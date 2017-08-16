//视图
//左侧是员工类型的容器视图
Ext.define('app.view.basis.Panel', {
    extend: 'Ext.container.Container',
    requires: ['ux.form.field.SearchField'],
    xtype: 'basisPanel',
    viewModel: {
        type: 'basis'
    },
    //tree+panel布局，这样不会有布局错误
    layout: {
        type: 'hbox'
    },
    defaults: {
        height: '100%'
    },
    items: [{
        width: 250,
        xtype: 'categoryTree',
        reference: 'categoryTree',
        viewConfig: {
            //自定义配置，用于onTreeSelection方法中
            activityPanel: 'basisPanel'
        },
        listeners: {
            //监听选中事件
            select: 'onTreeSelection'
        }
    }, {
        xtype: 'container',
        flex:1,
        //返回页面集合
        backView: [],
        reference: 'basisPanel',
        layout: {
            type: 'card',
            anchor: '100%'
        },
        margin: '0 0 0 20'
    }]
});