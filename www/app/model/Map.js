//模型
//百度地图
Ext.define('app.model.Map', {
    extend: 'Ext.data.Model',
    fields: [{
            name: 'lng'
        },
        {
            name: 'lat'
        },
        {
            name: 'label'
        }
    ]
});