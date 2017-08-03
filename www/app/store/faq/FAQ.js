//数据仓库
//帮助列表
Ext.define('app.store.faq.FAQ', {
    extend: 'Ext.data.Store',
    alias: 'store.faq',
    model: 'app.model.faq.Category',
    autoLoad: true,
    proxy: {
        type: 'api',
        url: config.faq.list
    }
});
