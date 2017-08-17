//模型
//会员级别
Ext.define('app.model.basis.Level', {
    extend: 'Ext.data.Model',
    fields: [{
        type: 'string',
        name: 'coding'
    },
    {
        type: 'string',
        name: 'type'
    }],
    proxy: {
        type: 'api',
        api: {
            read: config.basis.level.list,
            create: config.basis.level.add,
            update: config.basis.level.update
        }
    }
});