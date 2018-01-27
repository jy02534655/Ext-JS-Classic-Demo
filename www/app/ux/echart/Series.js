//扩展
//百度图表Series
//已测支持柱状图、折线图、其他图理论上支持
//需要在app.json中引入对应的js，css
Ext.define('ux.echart.Series', {
    //继承百度图表基类
    extend: 'ux.echart.Base',
    xtype: 'uxEchartSeries',
    //以下配置写到config内会失效，原因暂未查明
    //不能用config是因为赋值不能识别{},但是可以识别[]这种格式
    //这里用xAxis:[]这种模式绕过这个限制
    config: {
        //x轴数据对应字段
        xField: 'name',
        //y轴数据对应字段
        //'name' 或者 ['name1','name2']
        //指为字符串时固定为柱状图，数组可配置其他类型
        yField: 'value',
        //颜色配置
        //当yField值为sring时生效
        //可以配置单个主题背景色，颜色按配置顺序循环
        colorList: ['#00aeff', '#4372e2', '#ffa800'],
        //x轴配置，参考百度图表对应配置
        //xAxis:[{key:value}]
        //type: 'category'不可更改
        xAxis: [{}],
        //y轴配置，参考百度图表对应配置
        //xAxis:[{key:value}]
        //type: 'value'不可更改
        yAxis: [{}],
        //是否翻转xy轴
        flipXY: false,
        //tooltip配置，参考百度图表对应配置
        //tooltip:[{key:value}]
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                // 坐标轴指示器，坐标轴触发有效
                type: 'shadow' // 默认为直线，可选为：'line' | 'shadow'
            }
        },
        //legend配置，参考百度图表对应配置
        //当yField值为数组时生效
        //legend:[{key:value}]
        //默认不显示
        legend: false,
        //legendIco配置，参考百度图表legend中data配置
        legendIco: 'rect',
        //series配置，参考百度图表对应配置
        //其中数据对应yField:['name1','name2']配置
        //series:[{key:value},{key:value}]
        series: null
    },
    //初始化legend
    applyLegend: function (data) {
        if (!data) {
            return data;
        }
        return this.dealObj(data, true);
    },
    //初始化xAxis
    applyXAxis: function (data) {
        return Ext.apply({
                type: 'category'
            },
            this.dealObj(data, true)
        );
    },
    //初始化yAxis
    applyYAxis: function (data) {
        return Ext.apply({
                type: 'value'
            },
            this.dealObj(data, true)
        );
    },
    //初始化tooltip
    applyTooltip: function (data) {
        return this.dealObj(data, true);
    },
    //初始化series
    applySeries: function (data) {
        return this.dealObj(data);
    },
    //创建图表
    createChart: function (store) {
        //图表
        var me = this,
            //获取图表对象
            chart = me.getChart(),
            //x轴配置
            xAxis = me.getXAxis(),
            //y轴配置
            yAxis = me.getYAxis(),
            //展示内容配置
            series = me.getSeries(),
            //legend配置
            legend = me.getLegend(),
            //legendIco配置
            legendIco = me.getLegendIco(),
            //x轴数据对应字段
            xField = me.getXField(),
            //y轴数据对应字段
            yField = me.getYField(),
            //颜色配置
            colorList = me.getColorList(),
            //颜色配置长度
            length = colorList.length,
            //legend数据
            legendData = [],
            //x轴数据
            xData = [],
            //y轴数据
            yData = [],
            //遍历起始点
            i = 0,
            option;
        if (Ext.isArray(yField)) {
            //如果yField是数组，那么展示多个柱状图
            var yLength = yField.length,
                j;
            //yData初始化处理
            for (j = 0; j < yLength; j++) {
                yData.push([]);
            }
            //循环数据源组合x，y轴数据
            store.each(function (rec) {
                //x轴数据
                xData.push(rec.get(xField));
                //循环处理y轴数据
                for (j = 0; j < yLength; j++) {
                    yData[j].push(rec.get(yField[j]));
                }
            });
            //将y轴数据配置到series中
            //注意series长度要和yField长度一样，否则会出错
            for (j = 0; j < yLength; j++) {
                series[j].data = yData[j];
                legendData.push({
                    name: series[j].name,
                    icon: legendIco
                });
            }
        } else {
            //循环数据源组合x，y轴数据
            store.each(function (rec) {
                //x轴数据
                xData.push(rec.get(xField));
                //y轴数据，动态配置单个柱状图的颜色
                yData.push({
                    value: rec.get(yField),
                    itemStyle: {
                        normal: {
                            color: colorList[i]
                        }
                    }
                });
                i++;
                //颜色超出预定义范围则归0
                if (i >= length) {
                    i = 0;
                }
            });
            series = Ext.apply({
                    type: 'bar'
                },
                series
            );
            //设置y轴数据
            series.data = yData;
        }
        //设置x轴数据
        xAxis.data = xData;
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
            series: series,
            tooltip: me.getTooltip()
        }, me.getOption());
        //是否翻转xy轴
        if (me.getFlipXY()) {
            option = Ext.apply({
                xAxis: yAxis,
                yAxis: xAxis
            }, option);
        } else {
            option = Ext.apply({
                xAxis: xAxis,
                yAxis: yAxis
            }, option);
        }
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