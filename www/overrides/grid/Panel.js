//重写类 grid
//取消加载遮罩
//加入默认样式
//数据可复制
Ext.define('override.grid.Panel', {
    override: 'Ext.grid.Panel',
    viewConfig: {
        //数据可复制
        enableTextSelection: true,
        loadMask: false,
        width: '100%'
    },
    //有边框
    border: true,
    //cls
    cls: 'user-grid'
});