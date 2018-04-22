//数据源
//百度地图数据源
Ext.define('app.view.map.Model', {
    extend: 'Ext.app.ViewModel',
    alias: 'viewmodel.map',
    stores: {
        mapHomeStore:{
            type:'mapHome'
        }
    }
});
