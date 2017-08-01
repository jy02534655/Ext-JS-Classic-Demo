//数据仓库
//会员卡类型
Ext.define('app.store.basis.Card', {
    extend: 'Ext.data.Store',
    //别名在viewModel中可以通过 stores: {basisCardStore: {type: 'basisCard'}}
    //来创建
    alias: 'store.basisCard',
    model: 'app.model.basis.Card',
    //自动加载
    autoLoad: true
});