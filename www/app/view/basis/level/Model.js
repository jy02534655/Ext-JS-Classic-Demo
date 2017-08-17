//数据源
//会员级别
Ext.define('app.view.basis.level.Model', {
    extend: 'Ext.app.ViewModel',
    alias: 'viewmodel.basisLevel',
    stores: {
        //卡类型
        basisLevelStore: {
            type: 'basisLevel'
        }
    }
});
