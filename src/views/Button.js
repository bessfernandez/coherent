/*jsl:import FormControl.js*/

/** Basic support for buttons
 */
coherent.Button= Class.create(coherent.FormControl, {

    onmousedown: function(event)
    {
        var node= this.viewElement();
        Element.addClassName(node, coherent.Style.kActiveClass);
    },

    onmouseup: function(event)
    {
        var node= this.viewElement();
        Element.removeClassName(node, coherent.Style.kActiveClass);
    }
    
});
