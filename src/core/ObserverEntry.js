/*jsl:import startup.js*/

/** An ObserverEntry is an internal structure and probably doesn't hold much
    general value.
    
    @private
    
    @property {Object} observer - A reference to the object which will be used
              to call the callback method.
    @property {Function} callback - A reference to a function which will be
              invoked when changes occur.
    @property {String} context - General purpose value which will be passed to
              the observer method as the final parameter (context). This is
              often used to construct the full key path from a child
              notification.
 */
coherent.ObserverEntry=Class._create({

    /** Construct a new ObserverEntry
     */
    constructor: function(observer, callback, context)
    {
        this.observer= observer;
        this.callback= callback;
        this.context= context;
    },
    
    observeChangeForKeyPath: function(change, keyPath)
    {
        //  check to see whether this observer has already been notified
        if (!this.callback || !this.observer ||
            this.observer.__uid in change.notifiedObserverUids)
            return;

        this.callback.call(this.observer, change, keyPath,
                           this.context);
    }
    
});
