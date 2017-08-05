//模型
//课程类别
Ext.define('app.model.basis.Course', {
    extend: 'Ext.data.Model',
    fields: [{
        type: 'string',
        name: 'coding'
    },
    {
        type: 'string',
        name: 'type'
    }, {
        type: 'string',
        name: 'remark'
    }],
    //代理，用于增加和修改
    proxy: {
        type: 'api',
        api: {
            //列表
            read: config.basis.course.list,
            //新增
            create: config.basis.course.add,
            //更新
            update: config.basis.course.update
        }
    }
});