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
        //模拟接口需要在app.json里面引入ux扩展包，ux扩展包默认sdk里面没有，需要手动引入进去
        //如果不知道模拟接口地址应该怎么写的，可以打印或者设置断点看下data.$className，url的值        
        //url的值就是模拟接口请求地址        
        //注册模拟接口
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
