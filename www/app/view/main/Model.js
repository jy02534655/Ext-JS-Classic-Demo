//数据源
//基础数据源，可放置一些基础数据对象
Ext.define('app.view.main.Model', {
    extend: 'Ext.app.ViewModel',
    alias: 'viewmodel.main',
    stores: {
        //默认视图数据源
        views: {
            type: 'views'
        }
    },
    data: {
        currentView: null
    }
});
