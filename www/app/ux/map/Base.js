Ext.define('ux.map.Base', {
    alternateClassName: 'bMap',
    mixins: ['ux.mixin.Loader'],
    extend: 'Ext.Container',
    xtype: 'bMapBase',
    // git不支持https
    jsUrl: 'http://api.map.baidu.com/getscript?v=3.0&ak=jgFF0lzutU2VK9mAx4p9pzB7A8EMZC2h&services',
    html:'git强制https访问，百度js无法加载。不能在线预览，请下载到本地运行...',
    config: {
        width: '100%',
        height: '100%',
        //私有变量，地图对象
        map: null,
        //初始配置
        //中心点，可以是城市名称，也可以是{lng:'',lat:''}格式的坐标数据
        mapCenter: '北京',
        //数据仓库
        store: null,
        //数据源
        data: null,
        //lng坐标name
        lngName: 'lng',
        //lat坐标name
        latName: 'lat'
    },
    //数据仓库事件配置
    storeEventHooks: {
        //加载数据后处理逻辑
        load: 'onLoadStore'
    },
    //初始化
    initComponent: function () {
        var me = this;
        me.callParent();
        //视图绘制完成后再加载百度地图，以免地图加载出错
        me.on({
            resize: 'initMap',
            scope: me
        });
    },
    //初始化地图
    initMap: function () {
        var me = this;
        //引入百度地图js
        me.loadScript(me.jsUrl, 'baiduMap').then(function () {
            me.createMap();
        });
    },
    //创建地图
    createMap: function () {
        var me = this,
            map = me.getMap();
        //console.log(map);
        if (!map) {
            //创建地图
            map = new BMap.Map(me.el.dom, {
                //禁止鼠标单击事件
                enableMapClick: false,
                minZoom: 3,
                maxZoom: 19
            });
        }
        //开启鼠标滚轮缩放
        map.enableScrollWheelZoom(true);
        //地图加载完成触发
        map.addEventListener('load',
            function () {
                console.log('showMap');
                //地图加载完毕触发事件
                me.fireEvent('showMap', me);
            });
        me.setMap(map);
        //设置中心点
        me.centerAndZoom(me.getMapCenter());
    },
    //设置中心点和地图显示级别
    //设初始化地图。 如果center类型为Point时，zoom必须赋值，范围3-19级，若调用高清底图（针对移动端开发）时，zoom可赋值范围为3-18级。如果center类型为字符串时，比如“北京”，zoom可以忽略，地图将自动根据center适配最佳zoom级别
    centerAndZoom: function (point, zoom) {
        var map = this.getMap();
        if (map) {
            if (Ext.isObject(point)) {
                point = BMap.Point(point.lng, point.lat);
                zoom = zoom || 18;
            }
            map.centerAndZoom(point, zoom);
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
            if (data) {
                //清除旧数据
                store.removeAll();
                //重新填充数据
                store.add(data);
                //重新加载数据
                me.onLoadStore();
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
                me.onLoadStore();
            }
        }
        if (oldStore) {
            //移除监听
            oldStore.un(events);
        }
    },
    //数据加载成功,加载坐标点
    onLoadStore: function () {
        var me = this,
            map = me.getMap(),
            //lng字段名称
            lngName = me.getLngName(),
            //lat字段名称
            latName = me.getLatName(),
            store = me.getStore(),
            item;
        if (map) {
            //清除旧的标注
            map.clearOverlays();
            //遍历数据
            store.each(function (record) {
                item = record.getData();
                me.addMaeker(item[lngName], item[latName], item, me, map);
            });
        }
    },
    //添加覆盖物
    addMaeker: function (lng, lat, data) {
        var me = this,
            map = me.getMap(),
            point = new BMap.Point(lng, lat),
            marker = new BMap.Marker(point),
            label = data.label;
        //其他数据
        marker.options = data;
        marker.addEventListener('click',
            function (t) {
                // console.log('click', t.currentTarget.options);
                me.onClickDep(this, t.currentTarget.options);
            });
        marker.addEventListener('mouseover',
            function (t) {
                console.log('mouseover', t.currentTarget.options);
                me.onMouseoverDep(this, t.currentTarget.options);
            });
        marker.addEventListener('mouseout',
            function (t) {
                console.log('mouseout', t.currentTarget.options);
                me.onMouseoutDep(this, t.currentTarget.options);
            });
        if (label) {
            me.markerSetLabel(marker, label);
        }
        // 将标注添加到地图中
        map.addOverlay(marker);
    },
    //为覆盖物添加文字
    markerSetLabel: function (marker, label) {
        var text = label,
            style;
        if (Ext.isObject(label)) {
            //文字
            text = label.text;
            //文字样式
            style = label.style;
        }
        label = new BMap.Label(text, {
            offset: new BMap.Size(0, 2)
        });
        if (style) {
            label.setStyle(style);
        }
        marker.setLabel(label);
    },
    //预留空方法，在子类中实现
    onClickDep: Ext.emptyFn,
    //预留空方法，在子类中实现
    onMouseoverDep: Ext.emptyFn,
    //预留空方法，在子类中实现
    onMouseoutDep: Ext.emptyFn,
    //视图销毁时
    doDestroy: function () {
        this.setMap(null);
        this.setStore(null);
        this.callParent(arguments);
    }
});