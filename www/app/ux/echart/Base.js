//扩展
//百度图表基础类
//所有的百度图表类都基于这个类进行扩展
//初始化了option配置
//支持data，store直接赋值
//支持bind:{store:'{store}'}动态绑定数据
//细节配置参考百度图表api http://echarts.baidu.com/option.html
//需要在app.json中引入对应的js，css
//这里写法还有些问题，在频繁切换视图时可能会引起布局出错
//重写Ext.dom.Element解决具体方案参考override.dom.Element
Ext.define('ux.echart.Base', {
    extend: 'Ext.Container',
    //引入store相关类
    requires: [
        'Ext.data.Store',
        'Ext.data.StoreManager'
    ],
    //配置项
    config: {
        //默认铺满容器
        width: '100%',
        height: '100%',
        //数据仓库
        store: null,
        //数据源
        data: null,
        //图表对象
        chart: null,
        //配置项，参考百度图表对应配置
        //option:[{key:value}]
        option: null
    },
    //数据仓库事件配置
    storeEventHooks: {
        //加载数据后处理逻辑
        load: 'initchart',
        //加载数据前处理逻辑
        beforeload: 'clearChart'
    },
    //全局事件配置
    globalEventHooks: {
        //全局重绘视图事件
        //浏览器在全屏与非全屏状态中切换时，视图本身的resize事件不会被触发
        //所以在这里要做一个全局监听
        resize: 'onResize',
        //自动销毁
        destroyable: true
    },
    //初始化
    initComponent: function () {
        var me = this,
            //获取全局监听配置
            events = Ext.apply({
                scope: me
            }, me.globalEventHooks);
        me.callParent(arguments);
        //视图绘制完成后再加载图表，避免出现布局错误
        me.on({
            resize: 'onResize',
            scope: me
        });
        //全局监听
        Ext.on(events);
        //重绘图表方法，可延迟执行
        //延迟执行是为了防止短时间内频繁触发该方法，影响性能
        me.resizeChart = Ext.create('Ext.util.DelayedTask',
            function () {
                var chart = me.getChart();
                if (chart) {
                    chart.resize();
                }
            });
    },
    /**
     * 在6.2.1+中config配置值不能识别{},但是可以识别[]这种格式
     * 这里特别处理一下
     * 
     * @param {any} data 配置数据
     * @param {bool} isObj 是否强制只返回第一个配置
     * @returns 默认返回原值，如果只有一个配置则返回obj
     */
    dealObj: function (data, isObj) {
        if (!data || !Ext.isArray(data)) {
            return {};
        } else if (isObj || data.length == 1) {
            return data[0];
        }
        return data;
    },
    //初始化option
    applyOption: function (data) {
        return this.dealObj(data, true);
    },

    //绘制视图
    onResize: function () {
        var me = this;
        if (me.isInitChartEnd) {
            //如果图表已经展示，重绘图表
            me.resizeChart.delay(100);
        } else {
            //标识
            //基础视图绘制完成可以加载图表
            me.isInitChart = true;
            //初始化图表
            me.initchart();
        }
    },
    //初始化图表
    initchart: function () {
        var me = this,
            //获取数据仓库
            store = me.getStore();
        //视图已绘制完成并且有数据才能继续
        if (!me.isInitChart || !store || !store.getCount()) {
            return;
        }
        //调用加载数据方法
        //这里是基础父类，无须具体实现
        //在子类中实现
        me.createChart(store);
        //标识
        //图表加载数据结束
        me.isInitChartEnd = true;
    },
    //预留空方法，在子类中实现
    createChart: Ext.emptyFn,
    //清理chart
    clearChart: function (store) {
        //删除数据仓库数据
        store.removeAll();
        var chart = this.getChart();
        if (chart) {
            //清除图表
            chart.clear();
        }
    },
    //初始化data
    applyData: function (data) {
        return data;
    },
    /**
     * 更新data
     * 
     * @param {any} data 
     */
    updateData: function (data) {
        //获取数据仓库
        var me = this,
            store = me.getStore();
        if (!store) {
            //如果数据仓库不存在,根据当前数据动态生成一个数据仓库
            me.setStore(Ext.create('Ext.data.Store', {
                data: data,
                autoDestroy: true
            }));
        } else {
            //如果数据仓库已存在，清理chart
            me.clearChart(store);
            if (data) {
                //重新填充数据
                store.add(data);
                //重新初始化图表
                me.initchart();
            }
        }
    },
    /**
     * 初始化store
     * 
     * @param {any} store 
     * @returns 
     */
    applyStore: function (store) {
        if (Ext.isString(store)) {
            //如果是字符串配置，那么根据storeId查找数据仓库
            store = Ext.data.StoreManager.lookup(store);
        }
        return store;
    },
    /**
     * 更新store
     * 
     * @param {any} newStore 
     * @param {any} oldStore 
     */
    updateStore: function (newStore, oldStore) {
        var me = this,
            //获取数据仓库监听配置
            events = Ext.apply({
                scope: me
            }, me.storeEventHooks);
        if (newStore) {
            //监听事件
            newStore.on(events);
            //console.log('isLoaded:', newStore.isLoaded());
            //如果数据已加载成功，初始化图表
            if (newStore.isLoaded()) {
                me.initchart();
            }
        }
        if (oldStore) {
            //移除监听
            oldStore.un(events);
        }
    },

    //视图销毁时
    doDestroy: function () {
        var me = this,
            //获取全局监听配置
            events = Ext.apply({
                scope: me
            }, me.globalEventHooks);
        //移除全局监听事件
        Ext.un(events);
        //取消执行重绘方法
        me.resizeChart.cancel();
        //销毁方法
        me.resizeChart = null;
        //移除数据仓库
        me.setStore(null);
        me.callParent(arguments);
    }
});