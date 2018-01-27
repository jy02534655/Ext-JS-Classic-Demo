//扩展
//百度图表饼状图
//需要在app.json中引入对应的js，css
Ext.define('ux.echart.Pie', {
    extend: 'ux.echart.Base',
    xtype: 'uxEchartPie',
    config: {
        //显示名称字段名称
        nameField: 'name',
        //值字段名称
        valueField: 'value',
        //pie配置，参考百度图表对应配置
        //pie:[{key:value}]
        //type: 'pie'不可更改
        pie: [{}],
        //legend配置，参考百度图表对应配置
        //legend:[{key:value}]
        //默认不显示
        legend: false,
        //legendIco配置，参考百度图表legend中data配置
        legendIco: 'rect',
        //颜色配置
        colorList: ['#00aeff', '#0075d1', '#27d4ff', '#ffa800'],
    },
    //初始化legend
    applyLegend: function (data) {
        if (!data) {
            return data;
        }
        return this.dealObj(data, true);
    },
    //初始化pie
    applyPie: function (data) {
        return Ext.apply({
                type: 'pie'
            },
            this.dealObj(data, true)
        );
    },
    //初始化图表
    createChart: function (store) {
        //图表
        var me = this,
            //获取图表对象
            chart = me.getChart(),
            //饼状图配置
            pie = me.getPie(),
            //legend配置
            legend = me.getLegend(),
            //legendIco配置
            legendIco = me.getLegendIco(),
            //颜色配置
            colorList = me.getColorList(),
            //显示名称字段名称
            nameField = me.getNameField(),
            //值字段名称
            valueField = me.getValueField(),
            //颜色配置长度
            length = colorList.length,
            //legend数据
            legendData = [],
            //数据
            data = [],
            //遍历起始点
            i = 0,
            option;
        //循环数据源组合x，y轴数据
        store.each(function (rec) {
            //y轴数据，定义每个柱状图的颜色
            data.push({
                name: rec.get(nameField),
                value: rec.get(valueField),
                itemStyle: {
                    normal: {
                        color: colorList[i]
                    }
                }
            });
            legendData.push({
                name: rec.get(nameField),
                icon: legendIco
            });
            i++;
            //颜色超出预定义范围则归0
            if (i >= length) {
                i = 0;
            }
        });
        pie.data = data;
        //判断图表是否初始化
        if (!chart) {
            //没有初始化则初始化
            chart = echarts.init(me.el.dom);
            me.setChart(chart);
            //监听点击事件
            chart.on('click',
                function (params) {
                    console.log(params);
                    me.fireEvent('chartClick', me, params);
                });
        }
        //拼接配置
        option = Ext.apply({
            series: pie
        }, me.getOption());
        //是否有导航模块
        if (legend) {
            //导航模块数据
            legend.data = legendData;
            option = Ext.apply(option, {
                legend: legend
            });
        }
        //设置图表配置
        chart.setOption(option);
    }
});