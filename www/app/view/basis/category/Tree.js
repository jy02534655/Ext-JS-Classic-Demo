Ext.define('app.view.basis.category.Tree', {
    extend: 'Ext.tree.Panel',
    xtype: 'categoryTree',
    title: '员工类别',
    rootVisible: false,
    bind: '{basisCategoryStore}',
    displayField: 'text',
    header: {
        items: [{
            isLocal: true,
            isDepth: true,
            width: 140,
            xtype: 'uxSearchfield',
            bind: {
                store: '{basisCategoryStore}'
            },
            paramName: 'text'
        }]
    }
});