//视图
//树形菜单
Ext.define('app.view.basis.category.Tree', {
    extend: 'Ext.tree.Panel',
    xtype: 'categoryTree',
    title: '员工类别',
    rootVisible: false,
    bind: '{basisCategoryStore}',
    displayField: 'text',
    header: {
        items: [{
            //本地搜索
            isLocal: true,
            //树形数据全层级搜索
            isDepth: true,
            width: 140,
            //扩展插件
            //搜索插件
            xtype: 'uxSearchfield',
            bind: {
                store: '{basisCategoryStore}'
            },
            //搜索字段名称
            paramName: 'text'
        }]
    }
});