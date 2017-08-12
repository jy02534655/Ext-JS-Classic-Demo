//视图
//主容器
Ext.define('app.view.main.Box', {
    extend: 'Ext.container.Viewport',
    requires: ['Ext.button.Segmented', 'Ext.list.Tree'],
    controller: 'main',
    viewModel: 'main',
    itemId: 'mainView',
    layout: {
        type: 'vbox',
        //子视图铺满容器
        align: 'stretch'
    },

    listeners: {
        //监听页面初始化事件
        render: 'onMainViewRender'
    },

    items: [{
        //顶部导航栏
        xtype: 'toolbar',
        cls: 'sencha-dash-dash-headerbar shadow',
        //高度
        height: 64,
        itemId: 'headerBar',
        items: [{
            //左侧文字与图标
            xtype: 'component',
            reference: 'senchaLogo',
            cls: 'sencha-logo',
            html: '<div class="main-logo"><img src="resources/images/company-logo.png">Sencha</div>',
            //宽度与导航菜单栏宽度相同
            width: 250
        },
        {
            //菜单折叠/展开按钮
            margin: '0 0 0 8',
            ui: 'header',
            iconCls: 'x-fa fa-navicon',
            id: 'main-navigation-btn',
            handler: 'onToggleNavigationSize'
        },
        '->', {
            //帮助按钮
            iconCls: 'x-fa fa-question',
            ui: 'header',
            //触发路由
            href: '#view.faq',
            //本页打开
            hrefTarget: '_self',
            tooltip: '帮助'
        },
        {
            iconCls: 'x-fa fa-lock',
            ui: 'header',
            tooltip: '锁定',
            handler: 'onLock'
        },
        {
            iconCls: 'x-fa fa-sign-out',
            ui: 'header',
            tooltip: '退出登录',
            handler: 'onLoginOut'
        },
        {
            //相当于一个label
            xtype: 'tbtext',
            //动态绑定名称
            bind: '{userData.fullName}'
        },
        {
            //图片
            xtype: 'image',
            cls: 'header-right-profile-image',
            height: 35,
            width: 35,
            alt: '当前用户图像',
            //动态绑定头像
            bind: {
                src: '{userData.img}'
            }
        }]
    },
    {
        //下方容器
        xtype: 'container',
        id: 'main-view-detail-wrap',
        reference: 'mainContainerWrap',
        flex: 1,
        layout: {
            type: 'hbox',
            //是否支持动画效果
            //用于支持菜单栏折叠/展开动画效果
            animate: true,
            animatePolicy: {
                x: true,
                width: true
            }
        },
        items: [{
            //导航菜单模块
            //导航栏与右侧容器的滚动条相互独立，互不干涉
            height: '100%',
            scrollable: 'y',
            reference: 'navigationContainer',
            cls: 'navigationContainer',
            xtype: 'container',
            width: 250,
            //container套panle用以支持独立滚动条
            items: [{
                xtype: 'treelist',
                reference: 'navigationTreeList',
                itemId: 'navigationTreeList',
                ui: 'nav',
                width: 250,
                //展开按钮显示在右侧
                expanderFirst: false,
                //点击父菜单任何区域都可展开子菜单
                expanderOnly: false,
                //只有一个节点能展开
                singleExpand: true,
                listeners: {
                    //监听导航菜单选中改变事件
                    selectionchange: 'onNavigationTreeSelectionChange'
                }
            }]
        },
        {
            //内容展示模块
            xtype: 'container',
            height: '100%',
            flex: 1,
            reference: 'mainCardPanel',
            itemId: 'contentPanel',
            //返回页面集合，自定义属性
            backView: [],
            layout: {
                //跑马灯布局
                type: 'card',
                //暂时不知道用处
                anchor: '100%'
            },
            //子item默认配置
            defaults: {
                padding: 20
            }
        }]
    }]
});