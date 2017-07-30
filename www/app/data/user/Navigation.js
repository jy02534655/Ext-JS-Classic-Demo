//模拟数据源
//导航菜单
Ext.define('app.data.user.Navigation', {
    extend: 'app.data.Simulated',
    //注意
    //如果代理中指定了rootProperty为data
    //那么服务端返回的树形菜单数据中，子节点的字段名称也必须是data,
    //必须和rootProperty指定的值一样,否则会出现无限加载树形菜单导致浏览器卡死的情况
    data: {
        data: [{
            //标题
            text: '首页',
            //图标
            iconCls: 'x-fa fa-desktop',
            //指向视图
            viewType: 'home',
            //是否有子节点
            leaf: true
        },
        {
            text: '页面',
            iconCls: 'x-fa fa-leanpub',
            //注意
            data: [{
                text: '空白页',
                iconCls: 'x-fa fa-file-o',
                viewType: 'pageblank',
                leaf: true
            },
            {
                text: '404页',
                iconCls: 'x-fa fa-exclamation-triangle',
                viewType: 'page404',
                leaf: true
            },
            {
                text: '500页',
                iconCls: 'x-fa fa-times-circle',
                viewType: 'page500',
                leaf: true
            }]
        }]
    }
});