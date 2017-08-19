//模型
//销量统计
Ext.define('app.model.report.Sales', {
    extend: 'Ext.data.Model',
    fields: [{
        type: 'string',
        name: 'date'
    },
    {
        type: 'int',
        name: 'count'
    }]
});