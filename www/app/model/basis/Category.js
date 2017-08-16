//模型
//员工类型
Ext.define('app.model.basis.Category', {
    extend: 'Ext.data.TreeModel',
    fields: [{
        type: 'string',
        name: 'text'
    }, {
        type: 'string',
        name: 'remark'
    }],
    proxy: {
        type: 'api',
        api: {
            read: config.basis.category.list,
            create: config.basis.category.add,
            update: config.basis.category.update
        }
    }
});