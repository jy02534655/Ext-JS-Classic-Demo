//模型
//员工待遇
Ext.define('app.model.basis.Pay', {
    extend: 'Ext.data.TreeModel',
    fields: [{
        type: 'string',
        name: 'text'
    }, {
        name: 'checked',
        defaultValue: false
    }, {
        name: 'expanded',
        defaultValue: true
    }]
});