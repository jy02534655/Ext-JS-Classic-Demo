/*
 *项目入口文件，继承于app.Application
 */
Ext.application({
    extend: 'app.Application',
    //应用默认包名
    name: 'app',
    //引入数据源
    stores: ['NavigationTree'],
    //自动引入app目录下所以的类，不需要在其他地方再次引入
    requires: ['app.*'],
    //默认起始路由
    defaultToken: 'home',
    // 默认起始页面
    mainView: 'app.view.main.Box'
});