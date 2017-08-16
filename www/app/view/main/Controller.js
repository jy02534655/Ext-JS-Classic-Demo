//控制层
//核心控制层
Ext.define('app.view.main.Controller', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.main',

    routes: {
        //监听路由实现视图切换
        //这样写是为了方便扩展其他路由
        //类似view.hone的路由会触发onRouteChange方法
        'view.:node': {
            before: 'onLogonCheck',
            action: 'onRouteChange'
        },
        'box.:panel.:node': {
            before: 'onBoxLogonCheck',
            action: 'onRouteBoxChange'
        },
        //显示返回后会销毁的视图
        //这个视图可以不在导航菜单和视图白名单中
        'back.:panel.:node': {
            before: 'onBoxLogonCheck',
            action: 'pushNavigationView'
        },
        //登录成功后触发
        'user.:node': {
            before: 'onLogonCheck',
            action: 'loginSuccess'
        }
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
        var to = data.viewType,
            type = data.pageType;
        if (to) {
            //如果type有值表示在子容器中切换视图
            //没有值则在父容器中切换
            if (!type) {
                this.redirectTo('view.' + to);
            } else {
                this.redirectTo('box.' + type + '.' + to);
            }
        }
    },
    //由view.:node路由触发
    onRouteChange: function (id) {
        //切换视图
        this.setCurrentView('mainCardPanel', id);
    },
    //切换容器类页面
    onRouteBoxChange: function (panel, view) {
        //console.log('切换容器，当前容器：', panel);
        //先切换到子容器页面中
        this.setCurrentView('mainCardPanel', panel);
        //在子容器中切换页面
        //注意从返回页面返回时，如果js出错，ext有可能不会抛出错误
        //想要排除错误的话可以用setTimeout延迟执行，这样会抛出错误
        this.setCurrentView(panel, view);
    },
    //切换视图
    setCurrentView: function (card,hashTag) {
        if (!hashTag) {
            return;
        }
        //将大些字母转换为小写
        hashTag = hashTag.toLowerCase();
        var me = this,
        //获取所有引用对象
        refs = me.getReferences(),
        //获取容器视图
        mainCard = refs[card],
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
        //获取当前已经存在的window窗口
        window = Ext.WindowManager.getActive(),
        newView;
        //如果上一个视图存在则触发这个视图的自定义事件viewHide
        //扩展监听，有些时候可能会用到
        if (lastView) {
            lastView.fireEvent('viewHide', lastView);
        }
        //如果上个视图存在，并且是Window视图
        if (lastView && lastView.isWindow) {
            //销毁它
            lastView.destroy();
        } else {
            //上个视图不是Window视图窗口,当前页面有则关闭它
            if (window && window.isWindow && !window.isToast) {
                //console.log('关闭Window视图', window.title);
                window.close();
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
        //移除额外的返回页面
        me.pop(mainCard, mainCard.backView.length);
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

    //登录检测
    onBoxLogonCheck: function (box, id, action) {
        this.onLogonCheck(id, action);
    },
    //登录检测
    onLogonCheck: function (id, action) {
        //console.log('登录检测，userData', config.userData);
        //登录成功或者要跳转的页面在全局配置中已经配置才能继续
        if (config.userData || id in config.unCheck) {
            action.resume();
        }
    },

    //容器初始化时
    onMainViewRender: function () {
        var me = this;
        me.onAjaxInit();
        //检查是否登录，没有就跳转到登录页
        if (!config.userData) {
            me.redirectTo('view.login', true);
        }
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
            console.log('正在请求数据...');
            console.log('请求地址：', options.url);
            console.log('请求方式：', options.method);
            var params = options.params;
            if (params) {
                console.log('参数：', params);
            }
            if (options.jsonData) {
                console.log('json参数：', options.jsonData);
            }
            //某些情况下不需要遮罩
            //在参数里面增加isNoMask:true即可不显示遮罩
            if (!(params && params.isNoMask)) {
                me.messageTotal++;
                //console.log('开始请求，请求总数：', me.messageTotal);
                var window = Ext.WindowManager.getActive();
                //window弹窗才有遮罩
                if (window && (window.isWindow || window.isMask) && !window.isToast) {
                    me.maskWindow = window;
                    window.mask('正在请求数据，请等待...');
                } else {
                    Ext.getBody().mask('正在请求数据，请等待...');
                }
            }
            //else {
            //    console.log('开始请求，无须遮罩，请求总数：', me.messageTotal);
            //}
        });
        //ajax请求成功
        Ext.Ajax.on('requestcomplete',
        function (connection, response, options) {
            console.log('请求成功,服务端返回数据(已转为json对象)：', Ext.decode(response.responseText));
            var params = options.params;
            //某些情况下不需要遮罩
            if (!(params && params.isNoMask)) {
                me.hideMessage();
                //console.log('请求成功，请求总数：', me.messageTotal);
            }
        });
        //ajax请求失败
        Ext.Ajax.on('requestexception',
        function (connection, response, options) {
            var params = options.params;
            //某些情况下不需要遮罩
            if (!(params && params.isNoMask)) {
                me.hideMessage();
                //console.log('请求失败，请求总数：', me.messageTotal);
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

    //登录成功
    loginSuccess: function () {
        var me = this;
        me.loadNavigation();
        //绑定用户信息到数据源中
        me.getViewModel().setData({ userData: config.userData });
    },
    //加载导航树
    loadNavigation: function () {
        console.log('正在加载导航树');
        var me = this,
        store = Ext.getStore('navigationTree');

        store.on({
            //仅监听一次
            single: true,
            //监听菜单请求完成事件
            load: function (t, records) {
                //console.log('用户菜单请求完成');
                var data, rec, tree;
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
                    tree = me.lookup('navigationTreeList');
                    //如果导航菜单已经加载了，先置空store然再加载数据，这样不会出错
                    tree.setStore(null);
                    //loadNavigation方法触发时导航菜单还没有完成布局，直接绑定store的话会出现布局错误
                    //在这里我们等数据加载出来再去绑定数据，这样就不会出错了
                    tree.setStore(store);
                    //跳转到第一个菜单
                    me.redirectToView(data);
                }
            }
        });
        util.storeLoad(store, config.userData, true);
    },

    //显示一个不在左侧菜单栏中的视图
    pushNavigationView: function (card, xtype) {
        //console.log('显示额外页面：', xtype);
        var me = this,
        refs = me.getReferences(),
        //获取容器视图
        mainCard = refs[card],
        //获取布局
        mainLayout = mainCard.getLayout(),
        view = me.pop(mainCard, xtype);
        if (!view) {
            //console.log('目标返回页面不存在，新建：', xtype);
            view = Ext.widget(xtype, config.tmpConfig);
            // 整个框架停止布局，避免出错
            Ext.suspendLayouts();
            //容器中加入视图
            mainLayout.setActiveItem(mainCard.add(view));
            //加入返回页面集合中
            mainCard.backView.push(view);
            // 整个框架恢复布局，避免出错
            Ext.resumeLayouts(true);
        } else {
            //console.log('目标返回页面存在，切换：', xtype);
            mainLayout.setActiveItem(view);
        }
        //console.log(config.tmpConfig);
        config.tmpConfig = null;
        //console.log('当前容器内视图：', mainCard.items.keys.toString());
    },
    //检查指定返回页面是否已经存在
    //如果存在则删除它之后的返回页面,并且返回该页面
    //如果不存在返回false
    pop: function (mainCard, count) {
        var innerItems = mainCard.backView,
        last = innerItems.length - 1,
        i, item;
        for (i = last; i >= 0; i--) {
            //查找目标页面是否在返回集合中
            if ((Ext.isString(count) && Ext.ComponentQuery.is(innerItems[i], count))) {
                //获取到后面还有几个页面
                count = last - i;
                item = innerItems[i];
                break;
            }
        }
        //不在返回集合中
        if (!Ext.isNumber(count)) {
            return false;
        }
        var delItem;
        //在返回集合中则移除后面的返回界面
        for (i = 0; i < count; i++) {
            delItem = innerItems.pop();
            console.log('删除额外页面', delItem.xtype);
            mainCard.remove(delItem, true);
        }
        return item;
    },

    //退出登录
    onLoginOut: function () {
        config.userData = null;
        //直接刷新页面，避免出错
        window.location.reload();
    },
    //锁定
    onLock: function () {
        config.userData = null;
        this.redirectTo('view.userlock', true);
    },

    //树被选中时
    onTreeSelection: function (t, rec) {
        this.viewLoad(t, this.lookup(t.view.activityPanel), rec);
    },
    //左侧菜单发生变化时 内部容器切换时 触发
    viewLoad: function (tree,panel, record) {
        var layout = panel.getLayout(),
        //获取当前显示页面
        view = layout.getActiveItem();
        //容器记录已选中的树
        panel.treeRecord = record;
        //视图存在才能继续
        //原来是不必判断的，不过在做了左侧树的数据优化后需要判断
        if (view) {
            //激活视图记录已选中的树
            view.treeRecord = record;
            //console.log('请求数据');
            //console.log('当前容器：', panel.reference, '当前视图', view.xtype, '当前树名称', record ? record.get('text') : '');
            //如果不是列表则不加载数据
            //isManualLoad 是否手动加载数据
            if (view.isXType('grid') &&!view.isManualLoad) {
                util.listLoad(view, record.getData());
            }
            //触发自定义事件，以便处理相应业务逻辑
            view.fireEvent('treeSelect', tree, view, record);
        }
    },
});