/*jsl:import ../core/Bindable.js*/
/*jsl:import ../core/SortDescriptor.js*/


/** Base class used for all other controllers.
 */
coherent.Controller= Class.create(coherent.Bindable, {

    registerWithName: function(name)
    {
        if (!name)
            return;
        this.name= name;
        coherent.registerModelWithName(this, name);
    }
        
});





