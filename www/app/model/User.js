//模型
//用户
Ext.define('app.model.User', {
    extend: 'Ext.data.Model',
    requires: ['Ext.data.proxy.LocalStorage'],
    fields: [{
        name: 'userid',
        type: 'string'
    },
    {
        name: 'password',
        type: 'string'
    },
    {
        name: 'persist',
        type: 'boolean',
        defaultValue: false
    }],
    proxy: {
        type: 'localstorage',
        id: 'demo-login-user'
    }
});