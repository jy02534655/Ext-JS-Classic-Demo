//查询控件
//支持绑定store后单条件查询
//支持bind绑定store
//支持远程或本地过滤
Ext.define('ux.form.field.SearchField', {
    extend: 'Ext.form.field.Text',
    alias: 'widget.uxSearchfield',
    defaultBindProperty: 'store',
    mixins: ['Ext.util.StoreHolder'],
    //按钮
    triggers: {
        //清除按钮
        clear: {
            weight: 0,
            cls: Ext.baseCSSPrefix + 'form-clear-trigger',
            hidden: true,
            //清除搜索条件
            handler: 'clearValue',
            scope: 'this'
        },
        //查询按钮
        search: {
            weight: 1,
            cls: Ext.baseCSSPrefix + 'form-search-trigger',
            //查询
            handler: 'onSearchClick',
            scope: 'this'
        }
    },
    emptyText: '请输入关键词',
    msgTarget: 'title',
    //查询参数
    paramName: 'query',
    //是否本地过滤
    isLocal: false,
    //树形数据是否全局过滤
    //全局过滤需要一次性加载完整个树形菜单
    //需要store增加配置filterer: 'bottomup'
    //默认只过滤第一级
    isDepth: false,
    initComponent: function () {
        var me = this,
        store = me.store;
        me.on({
            //添加监听，监听回车键
            specialkey: function (f, e) {
                if (e.getKey() == e.ENTER) {
                    me.onSearchClick();
                }
            },
            //监听内容改变
            //在这里监听是为了实现多个搜索控件绑定同一个store时
            //界面能够同步
            change: function (t, value) {
                var clear = t.getTrigger('clear');
                //根据查询条件是否存在，显示隐藏小按钮
                if (value.length > 0) {
                    if (clear.hidden) {
                        clear.show();
                        t.updateLayout();
                    }
                } else {
                    clear.hide();
                    t.updateLayout();
                    me.onClearClick();
                }
            }
        });
        //如果strong是string类型，寻找对应的store
        if (Ext.isString(store)) {
            store = me.store = Ext.data.StoreManager.lookup(store);
        }
        //动态绑定store
        me.bindStore(store || 'ext-empty-store', true);
        me.callParent(arguments);
    },
    //动态绑定store
    bindStore: function (store) {
        var me = this;
        if (store && store != 'ext-empty-store') {
            me.store = store;
            store.on({
                refreshStore: function () { me.refreshStore();}
            });
            me.treepanel = me.up('treepanel');
        }
        return me;
    },
    //清除value
    clearValue: function () {
        this.setValue('');
    },
    //清除过滤
    onClearClick: function () {
        //console.log('清除过滤');
        var me = this,
        activeFilter = me.activeFilter,
        store = me.store;
        if (activeFilter) {
            store.getFilters().remove(activeFilter);
            me.activeFilter = null;
        } else {
            store.clearFilter(false);
            //如果是树形数据并且要求全局过滤
            //折叠菜单
            if (store.isTreeStore && me.isDepth) {
                me.treepanel.collapseAll();
            }
        }
    },
    //展开已知节点
    expandedNode: function (rec) {
        var nodes = rec.childNodes,
        length = nodes.length,
        i;
        if (length) {
            //如果存在子节点，展开子节点，并尝试展开子节点的子节点，递归
            rec.set('expanded', true);
            for (i = 0; i < length; i++) {
                this.expandedNode(nodes[i]);
            }
        }
    },
    //本地过滤
    localFilter: function (value) {
        var me = this,
        store = me.store,
        paramName = me.paramName,
        search = new RegExp(Ext.String.escapeRegex(value), 'i'),
        isTreeStore;
        //关键词改变时重置列表和搜索关键词
        me.value = value;
        me.list = [];
        if (!store) {
            return;
        }
        //是否是树形数据
        isTreeStore = store.isTreeStore;
        //清除原有的过滤器
        store.clearFilter(!!value);
        //如果是树形数据并且要求全局过滤
        //需要store增加配置filterer: 'bottomup'
        if (isTreeStore && me.isDepth) {
            //全局过滤
            store.getFilters().replaceAll({
                property: paramName,
                value: search
            });
            //遍历结果，展开所有已知子节点
            store.each(function (rec) {
                me.expandedNode(rec);
            });
        } else {
            //循环遍历store,开始过滤
            store.filter(function (rec) {
                //树形菜单只过滤第一层
                if (isTreeStore && rec.get('depth') != 1) {
                    return true;
                }
                return search.test(rec.get(paramName));;
            });
        }
    },
    getParentNode: function (node, list) {
        if (!node) {
            return;
        }
        list.push(node.getId());
        this.getParentNode(node.parentNode, list);
    },
    //过滤
    onSearchClick: function () {
        var me = this,
        value = me.getValue(),
        store,
        proxy;
        //通过验证才能过滤
        if (me.isValid() && value.length > 0) {
            //本地还是远程过滤
            if (!me.isLocal) {
                store = me.store;
                store.setRemoteFilter(true);
                // 设置代理，设置过滤参数
                proxy = store.getProxy();
                proxy.setFilterParam(me.paramName);
                proxy.encodeFilters = function (filters) {
                    return filters[0].getValue();
                }
                // Param name is ignored here since we use custom encoding in the proxy.
                // id is used by the Store to replace any previous filter
                me.activeFilter = new Ext.util.Filter({
                    property: me.paramName,
                    value: value
                });
                me.store.getFilters().add(me.activeFilter);
            } else {
                me.localFilter(value);
            }
        }
    },
    onDestroy: function () {
        //清除过滤条件
        var me = this,
        store = me.store;
        if (store) {
            me.onClearClick();
            me.store = null;
            //移除绑定
            me.bindStore(null);
        }
        me.callParent();
    }
});