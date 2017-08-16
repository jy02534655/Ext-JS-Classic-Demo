//数据源
//员工类型容器数据源
Ext.define('app.view.basis.Model', {
    extend: 'Ext.app.ViewModel',
    alias: 'viewmodel.basis',
    formulas: {
        //是否选中员工类型
        isCategorySelect: function (get) {
            var rec = get('categoryTree.selection');
            //设置全局变量，储存选中的员工类型
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
