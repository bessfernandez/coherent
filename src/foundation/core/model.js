/*jsl:import kvo.js*/


Object.extend(coherent, {

    dataModel: new coherent.KVO(),
    
    /** Register a model object in the binding context for the given name. If a
        previous model object was registered with the provided name, it will no
        longer be available.
        @param {coherent.KVO} model - the model object that should be available for binding
        @param {String} name - the name by which the object should be made available
        @deprecated Since version 2.0, the global data model should not be used.
     */
    registerModelWithName: function(model, name)
    {
        coherent.dataModel.setValueForKey(model, name);
    },

    /** Unregister a named model object from the binding context.
        @param {String} name - the name of the model object to remove from the context.
        @deprecated Since version 2.0, the global data model should not be used.
     */
    unregisterModelWithName: function(name)
    {
        delete coherent.dataModel[name];
    }

});

