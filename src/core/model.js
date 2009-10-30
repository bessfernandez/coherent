/*jsl:import kvo.js*/


/** @scope coherent
 */
Object.extend(coherent, {

    dataModel: new coherent.KVO(),
    
    /** Register a model object in the binding context for the given name. If a
        previous model object was registered with the provided name, it will no
        longer be available.
        @param model    the model object that should be available for binding
        @param name     the name by which the object should be made available
     */
    registerModelWithName: function(model, name)
    {
        coherent.dataModel.setValueForKey(model, name);
    },

    /** Unregister a named model object from the binding context.
        @param name     the name of the model object to remove from the context.
     */
    unregisterModelWithName: function(name)
    {
        delete coherent.dataModel[name];
    }

});

