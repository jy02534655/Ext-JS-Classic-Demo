//视图控制器
//会员卡类型
//注意这个视图控制器不是唯一的
//在多视图中通过  controller: 'basisCard', 会创建多个视图控制器
//每个视图控制器都依赖与创建它的视图，视图销毁这个视图控制器也就随之销毁了
Ext.define('app.view.basis.card.Controller', {
    extend: 'ux.app.ViewController',
    alias: 'controller.basisCard',
    //点击文字进行编辑
    onEditClick: function (t, rec) {
        this.createView(rec);
    },
    //点击添加按钮
    onAddClick: function () {
        this.createView();
    },
    //创建视图
    createView: function (rec) {
        Ext.widget('basisCardEdit', {
            viewModel: {
                data: {
                    //根据rec判断是新增还是修改
                    title: rec ? '修改会员卡类型: ' + rec.get('type') : '新增会员卡类型',
                    //新增则创建一个模型对象
                    //编辑则直接赋值
                    //用于新增编辑时操作数据，名称固定为data
                    data: rec ? rec : Ext.create('app.model.basis.Card')
                },
                stores: {
                    //用于新增编辑成功后保存数据，名称固定为store
                    store: this.getStore('basisCardStore')
                }
            }
        });
    },
    //保存
    onSave: function () {
        this.winModelSave();
    },
    //点击删除
    onDeleteClick: function () {
        this.onDelete(config.basis.card.del, 'id', '确认删除?');
    }
});