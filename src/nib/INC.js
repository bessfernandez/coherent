/*jsl:import ../net/XHR.js*/

/** Define a dynamic inclusion mechanism. The INC function pairs with the build
    process to create pre-packaged resources. For deployment, the actual content
    of the include is inserted into the minimised JS file. This reduces network
    traffic to a single file load, which can be a dramatic improvement when a
    page includes numerous dependent resources.

    One caveat of INC is that it automatically compresses out the whitespace in
    HTML. The following readable HTML will be compressed:
    
        <div>
            <span>Hi</span>
        </div>
    
    and included as:
    
        <div><span>Hi</span></div>
    
    This **does** have some layout implications -- but they are largely beneficial.

    This function automatically installs JS and CSS includes by creating the
    appropriate tag in the HEAD of the document. The return value in those cases
    is the empty string. For JSON resources, INC will evaluate the resource and
    return the value. For all other resources, it merely returns the text value.
    
    @function
    @name INC
    
    @param {String} relativeSource - This is the path to the resource to include
           relative to the including script. The paths will get fixed up at
           build time and during development -- when scripts are included
           singularly -- the parent script's path can be determined by inspecting
           the last script tag.
    @param {String} [content] - The actual content of the resource. This is only
           used by the build process to inject the pre-fetched value of the
           resource.
           
    @returns {String} The text value of the resource or the evaluated value in
             the case of JSON resources.
 */
/*jsl:declare INC*/
(function (){

    function findBaseScriptName()
    {
        var scripts= document.getElementsByTagName("script");
        if (!scripts || !scripts.length)
            throw new Error("Could not find script");

        var l= scripts.length;
        var s;
        
        for (--l; l>=0; --l)
        {
            s= scripts[l];
            if (s.src)
                return s.src;
        }
        
        throw new Error("No script tags with src attribute.");
    }

    function installScript(source)
    {
        if (!source || !source.length)
            return;
        
        //  eval in context of window
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.defer = false;

        if (coherent.Browser.IE)
            script.text= source;
        else
            script.appendChild(document.createTextNode(source));

        var head = document.getElementsByTagName('head').item(0);
        head.appendChild(script);
    }

    function installCss(css)
    {
        var head= document.getElementsByTagName('head')[0];
        var style= document.createElement('style');
        var content= document.createTextNode(css);
        style.appendChild(content);
        head.appendChild(style);
    }
    
    function INC(relativePath, content)
    {
        if (!content)
        {
            var scriptname= window.__filename__||findBaseScriptName();
            var lastSlash= scriptname.lastIndexOf('/');
            var prefix= scriptname.substring(0, lastSlash+1);
            var href= prefix + relativePath;

            content= "";
    
            var d= XHR.get(href, null, {
                                sync: true,
                                responseContentType: 'text/plain'
                            });
            
            function received(data)
            {
                content= data;
            }
            d.addCallback(received);
        }

        var lastDot= relativePath.lastIndexOf('.');
        var ext= relativePath.substring(lastDot).toLowerCase();

        switch (ext)
        {
            case '.html':
                return content.replace(/>\s+</g, '><');
            case '.js':
                coherent.Scripts.install(content);
                return "";
            case '.css':
                installCss(content);
                return "";
            case '.json':
                return eval('('+content+')');
            default:
                return content;
        }

        return content;
    }
    
    window.INC= INC;
})();
