//数据源
//会员卡类型
//注意这个数据源不是唯一的
//在多视图中通过 viewModel: {type: 'basis'} 会创建多个数据源
//每个数据源都依赖与创建它的视图，视图销毁这个数据源也就随之销毁了
Ext.define('app.view.basis.card.Model', {
    extend: 'Ext.app.ViewModel',
    alias: 'viewmodel.basisCard',
    stores: {
        //卡类型
        basisCardStore: {
            type: 'basisCard'
        }
    }
});
