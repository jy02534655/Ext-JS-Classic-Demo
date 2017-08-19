//模型
//市场占有率
Ext.define('app.model.report.Share', {
    extend: 'Ext.data.Model',
    fields: [{
        type: 'string',
        name: 'date'
    },
    {
        type: 'int',
        name: 'plt'
    },
    {
        type: 'int',
        name: 'jzc'
    },
    {
        type: 'int',
        name: 'xyf'
    }]
});