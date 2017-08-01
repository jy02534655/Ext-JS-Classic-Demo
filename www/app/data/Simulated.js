//ajax模拟器
Ext.define('app.data.Simulated', {
    requires: [
        'Ext.ux.ajax.JsonSimlet',
        'Ext.ux.ajax.SimManager'
    ],
    //当js文件被加载时？
    onClassExtended: function (cls, data) {
        //其他模拟数据源都继承这个类
        //所以我们在这里写注册代码
        //为当前类注册模拟接口
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
