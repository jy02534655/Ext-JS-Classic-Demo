//模型
//问题类别
Ext.define('app.model.faq.Category', {
    extend: 'Ext.data.Model',
    fields: [
        {
            type: 'string',
            name: 'name'
        }, {
            type: 'auto',
            name: 'questions'
        }
    ]
});
