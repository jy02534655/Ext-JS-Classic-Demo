/**
 * 项目入口文件
 */
Ext.define('app.Application', {
    extend: 'Ext.app.Application',
    //应用命名空间
    name: 'app',
    quickTips: false,
    platformConfig: {
        desktop: {
            quickTips: true
        }
    },
    //应用启动
    launch: function () {
        //移除加载动画
        Ext.fly('loading-mask').destroy();
        console.log('当前版本号：', config.ver);
        var eq = util.equals({ a: 1 }, { b: 2 });
        console.log('{ a: 1 } 与 { b: 2 }是否相同：', eq);
        eq = util.equals({ a: 1, c: { a: 1 } }, { a: 1, c: { a: 1 } });
        console.log('{ a: 1, c: { a: 1 } } 与 { a: 1, c: { a: 1 } }是否相同：', eq);
    },
    //应用有更新就会触发
    onAppUpdate: function () {
        window.location.reload();
    }
});
