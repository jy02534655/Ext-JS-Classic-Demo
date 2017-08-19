//模型
//员工统计
Ext.define('app.model.report.Employee', {
    extend: 'Ext.data.Model',
    fields: [{
        type: 'string',
        name: 'name'
    },
    {
        type: 'int',
        name: 'count'
    }]
});