//重写树形菜单按键监听类
//禁用上下键切换选中效果
//在本项目中，树形菜单每次切换选中项都会请求远程数据
//为了避免频繁切换导致数据请求出错，禁用此快捷效果
//修复树形菜单有横向滚动条时，子节点太多无法正常使用
//6.5.1是否存在此bug待测试
Ext.define('override.tree.NavigationModel', {
    override: 'Ext.tree.NavigationModel',
    onKeyDown: Ext.emptyFn,
    onKeyUp: Ext.emptyFn,
    /**
     * @private
     * Focuses the currently active position.
     * This is used on view refresh and on replace.
     * @return {undefined}
     */
    focusPosition: function (position) {
        var me = this,
            view,
            row,
            scroller;

        me.item = me.cell = null;
        if (position && position.record && position.column) {
            view = position.view;

            // If the position is passed from a grid event, the rowElement will be stamped into it.
            // Otherwise, select it from the indicated item.
            if (position.rowElement) {
                row = me.item = position.rowElement;
            } else {
                // Get the dataview item for the position's record
                row = view.getRowByRecord(position.record);
                // If there is no item at that index, it's probably because there's buffered rendering.
                // This is handled below.
            }
            if (row) {

                // If the position is passed from a grid event, the cellElement will be stamped into it.
                // Otherwise, select it from the row.
                me.cell = position.cellElement || Ext.fly(row).down(position.column.getCellSelector(), true);

                // Maintain the cell as a Flyweight to avoid transient elements ending up in the cache as full Ext.Elements.
                if (me.cell) {
                    me.cell = new Ext.dom.Fly(me.cell);

                    // Maintain lastFocused in the view so that on non-specific focus of the View, we can focus the view's correct descendant.
                    view.lastFocused = me.lastFocused = me.position.clone();

                    // Use explicit scrolling rather than relying on the browser's focus behaviour.
                    // Scroll on focus overscrolls. scrollIntoView scrolls exatly correctly.
                    scroller = view.getScrollable();
                    if (scroller) {
                        //6.0.0-6.5.1
                        //原代码scroller.scrollIntoView(me.cell);
                        //在树形菜单中需要禁止水平滚动，以防子节点太多、宽度不够形成横向滚动条时无法展开子节点
                        //暂未发现副作用
                        scroller.scrollIntoView(me.cell, false);
                    }
                    me.focusItem(me.cell);
                    view.focusEl = me.cell;
                }
                // Cell no longer in view. Clear current position.
                else {
                    me.position.setAll();
                    me.record = me.column = me.recordIndex = me.columnIndex = null;
                }
            }
            // View node no longer in view. Clear current position.
            // Attempt to scroll to the record if it is in the store, but out of rendered range.
            else {
                row = view.dataSource.indexOf(position.record);
                me.position.setAll();
                me.record = me.column = me.recordIndex = me.columnIndex = null;

                // The reason why the row could not be selected from the DOM could be because it's
                // out of rendered range, so scroll to the row, and then try focusing it.
                if (row !== -1 && view.bufferedRenderer) {
                    me.lastKeyEvent = null;
                    view.bufferedRenderer.scrollTo(row, false, me.afterBufferedScrollTo, me);
                }
            }
        }
    }
});