//数据仓库
//员工类型
Ext.define('app.store.basis.Category', {
    extend: 'Ext.data.TreeStore',
    alias: 'store.basisCategory',
    model: 'app.model.basis.Category',
    //过滤数据模式为自下而上
    filterer: 'bottomup',
    root: {
        text: '员工',
        expanded: false
    }
});