/**
 * @private
 */
Ext.define('Ext.pivot.plugin.configurator.SettingsController', {
    extend: 'Ext.app.ViewController',

    alias: 'controller.pivotsettings',

    init: function(view){
        var viewModel = this.getViewModel();

        viewModel.getStore('sLayout').loadData([
            [ view.outlineLayoutText, 'outline' ],
            [ view.compactLayoutText, 'compact' ],
            [ view.tabularLayoutText, 'tabular' ]
        ]);

        viewModel.getStore('sPositions').loadData([
            [ view.firstPositionText, 'first' ],
            [ view.hidePositionText, 'none' ],
            [ view.lastPositionText, 'last' ]
        ]);

        viewModel.getStore('sYesNo').loadData([
            [view.yesText, true],
            [view.noText, false]
        ]);
    },

    applySettings: function(){
        var vm = this.getViewModel(),
            view = this.getView(),
            cfg = Ext.clone(vm.get('form')),
            name;

        for(name in cfg){
            if(cfg[name] && cfg[name].isModel){
                cfg[name] = cfg[name].get('value');
            }
        }

        if(view.fireEvent('beforeapplypivotsettings', view, cfg) !== false){
            view.fireEvent('applypivotsettings', view, cfg);
            this.cancelSettings();
        }
    },

    cancelSettings: function(){
        var view = this.getView();

        view.setMatrixProperties(null);
        view.fireEvent('close', view);
    },

    onMatrixPropertiesChanged: function(view, properties){
        this.getViewModel().set('form', properties);
    }

});