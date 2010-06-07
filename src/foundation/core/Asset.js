/*jsl:import ../../foundation.js*/
/*jsl:import ../net/XHR.js*/

/** A generic reference to an asset within the application or one of its
    bundles.
  
    @property {String} href - The URL associated with the asset
    @property {String} dirname - The directory portion of the href
    @property {String} ext - The extension (including the dot) for the
      asset. Used to determine the type.
    
    @param {String} href - The URL for the asset. If this is a relative URL,
      it is assumed to be relative to the current bundle and will have the
      URL prefix of the bundle prepended to the href value.
    @param {String} [content] - The content for the asset. This is set by
      the build system when generating release mode versions of the
      bundle.
 */
coherent.Asset= Class._create({

  constructor: function(assetName)
  {
    if (!(this instanceof coherent.Asset))
      return new coherent.Asset(assetName);

    var href= assetName;
    
    if ('/'!==href.charAt(0) && !(/\w+:\/\//).test(href))
    {
      var currentUrl= coherent.Scripts.currentScriptUrl();
      var lastSlash= currentUrl.lastIndexOf('/');
      var prefix= currentUrl.substring(0, lastSlash+1);

      if ('/'!==href.charAt(0))
        href= [prefix, href].join('');
    }
    
    if (href in coherent.Asset.assetLookup)
      return coherent.Asset.assetLookup[href];
    coherent.Asset.assetLookup[href]= this;
    
    this.href= href;
    this.dirname= href.split('/').slice(0,-1).join('/');
    var lastDot= href.lastIndexOf('.');
    this.ext= href.substring(lastDot).toLowerCase();
  
    this.setContent(distil.dataForAssetWithNameInModule(assetName, null));
    return this;
  },

  toString: function()
  {
    return this.href;
  },

  valueOf: function()
  {
    return this.href;
  },

  load: function(sync)
  {
    var d= XHR.get(this.href, null, {
              sync: sync,
              responseContentType: 'text/plain'
            });
  
    function received(data)
    {
      this.setContent(data);
      return this.__content;
    }
    d.addCallback(received, this);
    return d;
  },
  
  installCss: function(css)
  {
    var dirname= this.dirname;
    css= css.replace(/url\("([^"]*)"\)/g, function(all, relativePath) {
      return 'url("' + dirname + relativePath + '")';
    });
  
    var head= document.getElementsByTagName('head')[0];
    var style= document.createElement('style');
    style.setAttribute('type', 'text/css');

    head.appendChild(style);

    if (coherent.Support.AssetsEvaluateChildren)
      style.appendChild(document.createTextNode(css));
    else
      style.styleSheet.cssText= css;
  },
  
  content: function()
  {
    if (!this.__content)
      this.load(true);
      
    return this.__content;
  },
  
  setContent: function(newContent)
  {
    if (!newContent)
    {
      this.__content= newContent;
      return;
    }
    
    switch (this.ext)
    {
      case '.json':
        this.__content= coherent.globalEval('('+newContent+')');
        break;
        
      case '.html':
        this.__content= newContent.replace(/>\s+</g, '><');
        break;
        
      case '.js':
        coherent.Scripts.install(newContent);
        this.__content= newContent;
        break;

      case '.css':
        this.installCss(newContent);
        this.__content= newContent;
        break;

      default:
        this.__content= newContent;
        break;
    }
  }
  
});

coherent.Asset.assetLookup= {};
