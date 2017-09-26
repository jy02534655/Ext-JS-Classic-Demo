//数据源
//员工级别
Ext.define('app.view.basis.level.Model', {
    extend: 'Ext.app.ViewModel',
    alias: 'viewmodel.basisLevel',
    stores: {
        //卡类型
        basisLevelStore: {
            type: 'basisLevel'
        },
        //员工待遇
        payStore: {
            type: 'basisPay'
        }
    }
});
