//ajax模拟器
Ext.define('app.data.Simulated', {
    requires: [
        'Ext.ux.ajax.JsonSimlet',
        'Ext.ux.ajax.SimManager'
    ],
    //项目初始化时
    //遍历data文件夹中的模拟数据源
    onClassExtended: function (cls, data) {
        //为每个数据源都创建模拟接口
        var url = data.$className.toLowerCase().replace(/\./g, '/').
                    replace(/^app\/data/, '~api'),
            simlet = {
                type: 'json',
                data: data.data
            },
            registration = {};

        registration[url] = simlet;
        Ext.ux.ajax.SimManager.register(registration);
    }
},
function () {
    //初始化模拟器
    Ext.ux.ajax.SimManager.init({
        //延迟1秒返回数据
        delay: 1000,
        defaultSimlet: null
    });
});
