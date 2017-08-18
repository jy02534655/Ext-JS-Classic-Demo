//数据仓库
//员工待遇
Ext.define('app.store.basis.Pay', {
    extend: 'Ext.data.TreeStore',
    alias: 'store.basisPay',
    model: 'app.model.basis.Pay',
    proxy: {
        type: 'api',
        url: config.basis.level.pay.tree
    },
    //隐藏总结点
    rootVisible: false,
    //禁止自动加载
    autoLoad: false,
    root: {
        name: '根节点',
        expanded: false
    }
});