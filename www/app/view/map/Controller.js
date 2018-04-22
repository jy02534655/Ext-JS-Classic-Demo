//视图控制器
//百度地图
Ext.define('app.view.map.Controller', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.map',
    onShowMap: function () {
        console.log('onShowMap');
        // var map = this.getView().getMap();
        // 随机向地图添加25个标注
        // var bounds = map.getBounds();
        // var sw = bounds.getSouthWest();
        // var ne = bounds.getNorthEast();
        // var lngSpan = Math.abs(sw.lng - ne.lng);
        // var latSpan = Math.abs(ne.lat - sw.lat);
        // var list = [];
        // for (var i = 0; i < 25; i++) {
        //     list.push({
        //         lng: sw.lng + lngSpan * (Math.random() * 0.7),
        //         lat: ne.lat - latSpan * (Math.random() * 0.7),
        //         lable: {
        //             text: i + 1,
        //             style: {
        //                 color: 'white',
        //                 'background-color': 'transparent',
        //                 border: 0,
        //                 width: '1.5em',
        //                 'text-align': 'center'
        //             }
        //         }
        //     });
        // }
        // console.log(Ext.encode(list).replace(/{"/g, '{').replace(/":/g, ':').replace(/,"/g, ',').replace(/"/g, '\''));
    }
});