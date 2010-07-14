/*jsl:import ../../ui.js*/

/** Factory function for creating views.
 */
function VIEW(markup, structure)
{
  if (1==arguments.length)
  {
    structure= markup;
    markup= null;
  }  

  function resolveViewNode(viewNode)
  {
    if (viewNode && 1===viewNode.nodeType)
      return viewNode;
    
    if (viewNode && 'string'===typeof(viewNode))
      return Element.query(viewNode);

    var asset;
    
    if (markup)
    {
      if (1===markup.nodeType)
        return markup;
      
      if ('string'===typeof(markup) && (viewNode=Element.query(markup)))
        return viewNode;

      if (markup instanceof coherent.Asset)
      {
        asset= markup;
        markup= null;
      }
    }
    else
    {
      var assetId= [setupView.__nib.name,setupView.__key].join("#") + ".html";
      var module= setupView.__nib.bundle.name;
      markup= distil.dataForAssetWithNameInModule(assetId, module);
      
      if (!markup)
      {
        var href= distil.urlForAssetWithNameInModule(assetId, module);
        asset= new coherent.Asset(href);
      }
    }
      
    if (asset)
      markup= asset.content();

    if (markup)
      viewNode= coherent.View.createNodeFromMarkup(markup);

    return viewNode;
  }
      
  function setupView(viewNode)
  {
    var view;
    
    viewNode= resolveViewNode(viewNode);
    if (!viewNode || 1!==viewNode.nodeType)
      throw new Error('Unable to find or create DOM for view.');
      
    var v;
    var p;

    if (':root' in structure)
    {
      v= structure[':root'];
      if (v && 'function'===typeof(v) && v.__factoryFn__)
        view= v.call(this, viewNode);
    }
    
    if (!view)
      view= new coherent.View(viewNode);
      
    for (p in structure)
    {
      if (':root'===p)
        continue;

      v= structure[p];
      if (!v || 'function'!==typeof(v) || !v.__factoryFn__)
        continue;

      v.call(view, p);
    }

    return view;
  }

  setupView.__factoryFn__= true;
  return setupView;
}

window.VIEW= VIEW;