//控制层
//核心控制层
Ext.define('app.view.main.Controller', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.main',

    routes: {
        //监听路由实现视图切换
        //这样写是为了方便扩展其他路由
        //类似view.hone的路由会触发onRouteChange方法
        'view.:node': 'onRouteChange',
    },

    lastView: null,
    //当前请求总数，起始值为0
    messageTotal: 0,
    //菜单被选中时
    onNavigationTreeSelectionChange: function (tree, node) {
        if (node) {
            this.redirectToView(node.getData());
        }
    },
    //跳转到指定页面
    redirectToView: function (data) {
        //获取目标页面
        var to = data.viewType;
        if (to) {
            //触发路由
            this.redirectTo('view.' + to);
        }
    },
    //由view.:node路由触发
    onRouteChange: function (id) {
        //切换视图
        this.setCurrentView(id);
    },
    //切换视图
    setCurrentView: function (hashTag) {
        if (!hashTag) {
            return;
        }
        //将大些字母转换为小写
        hashTag = hashTag.toLowerCase();

        var me = this,
        //获取所有引用对象
        refs = me.getReferences(),
        //获取容器视图
        mainCard = refs.mainCardPanel,
        //获取布局
        mainLayout = mainCard.getLayout(),
        //获取左侧菜单
        navigationList = refs.navigationTreeList,
        //获取左侧菜单数据仓库
        navigationStore = navigationList.getStore(),
        //获取视图白名单
        store = me.getStore('views'),
        //检查节点是否在导航菜单中，如果不在则在白名单中查找
        node = store.getAt(store.find('viewType', hashTag)) || navigationStore.findNode('viewType', hashTag),
        //获取目标视图名称，如果找不到则返回404页面
        view = (node && node.get('viewType')) || 'page404',
        //获取上一视图
        lastView = me.lastView,
        //检查目标视图是否已经存在
        existingItem = mainCard.child('component[routeId=' + hashTag + ']'),
        newView;
        //如果上一个视图存在则触发这个视图的自定义事件viewHide
        //扩展监听，有些时候可能会用到
        if (lastView) {
            lastView.fireEvent('viewHide', lastView);
        }
        //如果上个视图存在，并且是Window视图
        if (lastView && lastView.isWindow) {
            //如果这个视图是激活的，终止执行
            if (lastView.routeId == hashTag) {
                return;
            } else {
                //销毁他
                //console.log('销毁视图:', view);
                lastView.destroy();
            }
        }
        //将当前视图保存到lastView中
        lastView = mainLayout.getActiveItem();
        //如果目标视图不存在，创建这个视图
        if (!existingItem) {
            newView = Ext.create({
                xtype: view,
                // 用户视图切换时搜索查找
                routeId: hashTag,
                hideMode: 'offsets'
            });
        }
        //如果新视图不存在，或者新视图不是Window视图
        if (!newView || !newView.isWindow) {
            //如果目标视图存在
            if (existingItem) {
                // 直接激活目标视图
                if (existingItem !== lastView) {
                    mainLayout.setActiveItem(existingItem);
                }
                newView = existingItem;
                //触发这个视图的自定义事件viewShow
                //扩展监听，有些时候可能会用到
                newView.fireEvent('viewShow', newView);
            } else {
                //如果目标视图不存在
                // 整个框架停止布局，避免出错
                Ext.suspendLayouts();
                //容器中加入视图
                mainLayout.setActiveItem(mainCard.add(newView));
                // 整个框架恢复布局，避免出错
                Ext.resumeLayouts(true);
                //触发容器的自定义事件activeitemchange
                //扩展监听，有些时候可能会用到
                mainCard.fireEvent('activeitemchange', mainCard, newView, lastView);
            }
        }

        //如果不是白名单中的视图，则选中对应的节点
        if (node && !node.get('isOther')) {
            navigationList.setSelection(node);
        }
        //获取焦点
        //if (newView.isFocusable(true)) {
        //    newView.focus();
        //}
        //将当前视图保存到lastView
        me.lastView = newView;
    },

    //折叠或展开导航树
    onToggleNavigationSize: function () {
        var me = this,
        //获取引用对象
        refs = me.getReferences(),
        //导航菜单
        navigationList = refs.navigationTreeList,
        //导航菜单容器
        navigationContainer = refs.navigationContainer,
        //下方容器
        wrapContainer = refs.mainContainerWrap,
        //导航菜单是否折叠
        collapsing = !navigationList.getMicro(),
        new_width = collapsing ? 64 : 250;

        if (Ext.isIE9m || !Ext.os.is.Desktop) {
            //ie9以及其他低版本浏览器处理逻辑
            //停止布局处理
            Ext.suspendLayouts();
            // 动态设置顶部Ico宽度
            refs.senchaLogo.setWidth(new_width);
            //动态控制左侧导航栏宽度
            navigationContainer.setWidth(new_width);
            navigationList.setWidth(new_width);
            //设置菜单栏折叠状态
            navigationList.setMicro(collapsing);
            //恢复布局
            Ext.resumeLayouts(); // do not flush the layout here...
            // 低版本浏览无动画效果
            wrapContainer.layout.animatePolicy = wrapContainer.layout.animate = null;
            //下方容器重新布局
            wrapContainer.updateLayout(); // ... since this will flush them
        } else {
            if (!collapsing) {
                //如果是展开状态，调整树形导航栏样式
                navigationList.setWidth(new_width);
                navigationList.setMicro(false);
            }
            navigationList.canMeasure = false;

            // 动态设置顶部Ico样式
            refs.senchaLogo.animate({
                dynamic: true,
                to: {
                    width: new_width
                }
            });
            //动态控制左侧导航栏宽度
            navigationContainer.width = new_width;
            navigationList.width = new_width;
            //更新父容器布局
            wrapContainer.updateLayout({
                isRoot: true
            });
            //增加动画效果
            navigationList.el.addCls('nav-tree-animating');

            //折叠时处理逻辑
            if (collapsing) {
                navigationContainer.on({
                    afterlayoutanimation: function () {
                        //如果是折叠状态，调整树形导航栏样式
                        navigationList.setMicro(true);
                        navigationList.setWidth(new_width);
                        navigationList.el.removeCls('nav-tree-animating');
                        navigationList.canMeasure = true;
                    },
                    single: true
                });
            }
        }
    },
    //容器初始化时
    onMainViewRender: function () {
        var me = this;
        me.onAjaxInit();
        me.loadNavigation();
    },
    //监听ajax，增加自动遮罩效果
    //ajax请求自动遮罩
    onAjaxInit: function () {
        console.log('监听ajax，增加自动遮罩功能');
        //如果500毫秒类再次触发，之前触发的会自动取消
        var me = this;
        //监听ajax事件，开始请求时显示遮罩
        Ext.Ajax.on('beforerequest',
        function (connection, options) {
            var params = options.params;
            //某些情况下不需要遮罩
            //在参数里面增加isNoMask:true即可不显示遮罩
            if (!(params && params.isNoMask)) {
                me.messageTotal++;
                console.log('开始请求，请求总数：', me.messageTotal);
                var window = Ext.WindowManager.getActive();
                //window弹窗才有遮罩
                if (window && (window.isWindow || window.isMask) && !window.isToast) {
                    me.maskWindow = window;
                    window.mask('正在请求数据，请等待...');
                } else {
                    Ext.getBody().mask('正在请求数据，请等待...');
                }
            }
            else {
                console.log('开始请求，无须遮罩，请求总数：', me.messageTotal);
            }
        });
        //ajax请求成功
        Ext.Ajax.on('requestcomplete',
        function (connection, response, options) {
            var params = options.params;
            //某些情况下不需要遮罩
            if (!(params && params.isNoMask)) {
                me.hideMessage();
                console.log('请求成功，请求总数：', me.messageTotal);
            }
        });
        //ajax请求失败
        Ext.Ajax.on('requestexception',
        function (connection, response, options) {
            var params = options.params;
            //某些情况下不需要遮罩
            if (!(params && params.isNoMask)) {
                me.hideMessage();
                console.log('请求失败，请求总数：', me.messageTotal);
            }
            Ext.toast('请求失败，服务端无法连接或出错！');
        });
    },
    //重写ajax，在请求数据时自动加入请求动画遮罩
    //隐藏遮罩
    hideMessage: function () {
        var me = this;
        //console.log('加载完成，请求总数：', me.messageTotal);
        if (me.messageTotal > 1) {
            me.messageTotal--;
        } else {
            if (me.maskWindow && !me.maskWindow.isDestroyed) {
                me.maskWindow.unmask();
                me.maskWindow = null;
            }
            Ext.getBody().unmask();
            //请求总数归0
            me.messageTotal = 0;
        }
    },
    //加载导航树
    loadNavigation: function () {
        console.log('正在加载导航树');
        var me = this,
        store = Ext.getStore('navigationTree');
        //重置地址栏
        me.redirectTo('home');
        store.on({
            //仅监听一次
            single: true,
            //监听菜单请求完成事件
            load: function (t, records) {
                //console.log('用户菜单请求完成');
                var data, rec;
                if (records.length > 0) {
                    //获取第一个菜单
                    rec = records[0];
                    //默认菜单为自身
                    data = rec.getData();
                    //检查第一个菜单是否有子菜单
                    if (!rec.get('leaf')) {
                        //如果有子菜单则获取第一个子菜单
                        data = rec.get('data')[0];
                    }
                    //loadNavigation方法触发时导航菜单还没有完成布局，直接绑定store的话会出现布局错误
                    //在这里我们等数据加载出来再去绑定数据，这样就不会出错了
                    me.lookup('navigationTreeList').setStore(store);
                    //跳转到第一个菜单
                    me.redirectToView(data);
                }
            }
        });
        util.storeLoad(store);
    }
});