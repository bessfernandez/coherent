/*jsl:import FormControl.js*/

/** Basic support for buttons. The only real difference between a Button and a
    {@link coherent.FormControl} is support for adding the active class to the
    button while depressed. This makes things easier for IE.
 */
coherent.Button= Class.create(coherent.FormControl, {

  onmousedown: function(event)
  {
    var node= this.node;
    Element.addClassName(node, coherent.Style.kActiveClass);
  },

  onmouseup: function(event)
  {
    var node= this.node;
    Element.removeClassName(node, coherent.Style.kActiveClass);
  }
  
});
