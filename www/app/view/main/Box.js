//视图
//主容器
Ext.define('app.view.main.Box', {
    extend: 'Ext.container.Viewport',
    requires: ['Ext.button.Segmented', 'Ext.list.Tree'],
    controller: 'main',
    viewModel: 'main',
    cls: 'sencha-dash-viewport',
    itemId: 'mainView',
    layout: {
        type: 'vbox',
        //子视图铺满容器
        align: 'stretch'
    },

    listeners: {
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
            iconCls: 'x-fa fa-search',
            ui: 'header',
            href: '#searchresults',
            hrefTarget: '_self',
            tooltip: 'See latest search'
        },
        {
            xtype: 'tbtext',
            text: 'Goff Smith',
            cls: 'top-user-name'
        },
        {
            xtype: 'image',
            cls: 'header-right-profile-image',
            height: 35,
            width: 35,
            alt: 'current user image',
            src: 'resources/images/user-profile/2.png'
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
                store: 'navigationTree',
                width: 250,
                //展开按钮显示在右侧
                expanderFirst: false,
                //点击父菜单任何区域都可展开子菜单
                expanderOnly: false,
                //只有一个节点能展开
                singleExpand: true,
                listeners: {
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
            cls: 'sencha-dash-right-main-container',
            itemId: 'contentPanel',
            layout: {
                //跑马灯布局
                type: 'card',
                //暂时不知道用处
                anchor: '100%'
            }
        }]
    }]
});