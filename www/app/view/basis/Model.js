//数据源
//员工类型容器数据源
Ext.define('app.view.basis.Model', {
    extend: 'Ext.app.ViewModel',
    alias: 'viewmodel.basis',
    formulas: {
        isCategorySelect: function (get) {
            var rec = get('categoryTree.selection');
            config.categoryRecord = rec;
            return !!rec;
        }
    },
    stores: {
        //员工类型
        basisCategoryStore: {
            type: 'basisCategory'
        }
    }
});
