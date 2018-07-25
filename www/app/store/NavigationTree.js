//数据仓库
//导航菜单
Ext.define('app.store.NavigationTree', {
    extend: 'Ext.data.TreeStore',
    //对应的模型
    //如果store没有指定代理,会自动继承模型的代理
    //如果多个store继承同一个模型，并且模型指定了代理，store没有指定代理
    //那么这些store会出现数据共享的情况，请根据实际使用场景决定代理如何配置
    model: 'app.model.Navigation',
    //全局store需要在控制器活app.js中通过stores配置引入，如stores:['NavigationTree']
    //全局id可以通过Ext.getStore('navigationTree')找到这个对象
    storeId: 'navigationTree',
    data: {
        name: '根节点',
        expanded: false
    }
});