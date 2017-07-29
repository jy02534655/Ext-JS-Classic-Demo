/**
 * @private
 */
Ext.define('Ext.pivot.plugin.configurator.DropZone', {
    extend: 'Ext.drag.Target',

    groups: 'pivotfields',

    leftIndicatorCls: Ext.baseCSSPrefix + 'pivot-grid-left-indicator',
    rightIndicatorCls: Ext.baseCSSPrefix + 'pivot-grid-right-indicator',
    listItemSelector: '.' + Ext.baseCSSPrefix + 'listitem',
    listSelector: '.' + Ext.baseCSSPrefix + 'list',

    constructor: function(panel){
        var list = panel.getList();

        this.panel = panel;
        this.list = list;

        this.callParent([{
            element: list.getScrollable().getElement()
        }]);
    },

    getLeftIndicator: function() {
        if (!this.leftIndicator) {
            this.self.prototype.leftIndicator = Ext.getBody().createChild({
                cls: this.leftIndicatorCls,
                html: "&#160;"
            });
            this.self.prototype.indicatorWidth = this.leftIndicator.dom.offsetWidth;
            this.self.prototype.indicatorOffset = Math.round(this.indicatorWidth / 2);
        }
        return this.leftIndicator;
    },

    getRightIndicator: function() {
        if (!this.rightIndicator) {
            this.self.prototype.rightIndicator = Ext.getBody().createChild({
                cls: this.rightIndicatorCls,
                html: "&#160;"
            });
        }
        return this.rightIndicator;
    },

    accepts: function(info){
        var data = info.data,
            record = data.record,
            source = data.sourceList,
            target = this.panel,
            panel = target.up('pivotconfigpanel');

        if (!record) {
            return true;
        }

        if (!source.isXType('pivotconfigcontainer')) {
            source = source.up('pivotconfigcontainer');
        }

        return record.get('field').getSettings().isAllowed(target) && panel.isAllowed(source, target, data.record);
    },

    onDragMove: function(info){
        if(info.valid) {
            this.positionIndicator(info);
        }else{
            this.hideIndicators();
        }
    },

    onDragLeave: function(info){
        this.hideIndicators();
    },

    onDrop: function(info){
        var data = info.data,
            source = data.sourceList,
            target = this.panel,
            panel = target.up('pivotconfigpanel');

        this.hideIndicators();

        if (!panel) {
            return;
        }

        if (!source.isXType('pivotconfigcontainer')) {
            source = source.up('pivotconfigcontainer');
        }

        panel.dragDropField(source, target, data.record, data.position);
    },

    positionIndicator: function(info){
        var me = this,
            pos = -1,
            leftIndicator = me.getLeftIndicator(),
            rightIndicator = me.getRightIndicator(),
            indWidth = me.indicatorWidth,
            indOffset = me.indicatorOffset,
            el, item, leftXY, rightXY, minX, maxX, minY, maxY,
            leftAnchor, rightAnchor;

        el = me.getCursorElement(info, me.listItemSelector);
        if(el){
            item = el.component;
            leftAnchor = 'tl';
            rightAnchor = 'tr';
            pos = item.$dataIndex;
        }else{
            leftAnchor = 'bl';
            rightAnchor = 'br';
            pos = me.list.getViewItems().length;
            item = me.list.getItemAt(pos - 1);

            if(item){
                el = item.element;
            }else{
                el = me.getCursorElement(info, me.listSelector);
            }

        }

        leftXY = leftIndicator.getAlignToXY(el, leftAnchor);
        rightXY = rightIndicator.getAlignToXY(el, rightAnchor);

        leftXY[0] -= 1;
        rightXY[0] -= indWidth;
        if(leftAnchor === 'tl') {
            leftXY[1] -= indWidth;
            rightXY[1] -= indWidth;
        }

        minX = minY = - indOffset;

        minX += el.getX();
        maxX =  minX + el.getWidth();
        minY += el.getY();
        maxY = minY + el.getHeight();

        leftXY[0] = Ext.Number.constrain(leftXY[0], minX, maxX);
        rightXY[0] = Ext.Number.constrain(rightXY[0], minX, maxX);
        leftXY[1] = Ext.Number.constrain(leftXY[1], minY, maxY);
        rightXY[1] = Ext.Number.constrain(rightXY[1], minY, maxY);

        leftIndicator.show();
        rightIndicator.show();
        leftIndicator.setXY(leftXY);
        rightIndicator.setXY(rightXY);

        info.setData('position', pos);
    },

    hideIndicators: function(){
        this.getLeftIndicator().hide();
        this.getRightIndicator().hide();
    },

    /**
     * Find the element that matches the cursor position and selector.
     *
     * @param info
     * @param {String} selector The simple selector to test. See {@link Ext.dom.Query} for information about simple selectors.
     * @param {Number/String/HTMLElement/Ext.dom.Element} [limit]
     * The max depth to search as a number or an element that causes the upward
     * traversal to stop and is **not** considered for inclusion as the result.
     * (defaults to 50 || document.documentElement)
     * @param {Boolean} [returnDom=false] True to return the DOM node instead of Ext.dom.Element
     * @return {Ext.dom.Element/HTMLElement} The matching DOM node (or HTMLElement if
     * _returnDom_ is _true_).  Or null if no match was found.
     */
    getCursorElement: function (info, selector, limit, returnDom){
        var pos = info.cursor.current,
            elPoint = Ext.drag.Manager.elementFromPoint(pos.x, pos.y);

        return Ext.fly(elPoint).up(selector, limit, returnDom);
    }
});
