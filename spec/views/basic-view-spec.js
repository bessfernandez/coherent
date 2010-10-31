describe("View", function() {

  beforeEach(function(){
    coherent.dataModel= new coherent.KVO();
    loadFixtures("views/basic-view.html");
  });
  
  it("should attach to a node", function() {
    var view= new coherent.View('view');
    expect(view.node).toExist();
    expect(view.node).toHaveId('view');
  });

  describe("bindings", function() {

    beforeEach(function() {
      this.context= new coherent.KVO({
        html: "This <b>html</b> is wonderful.",
        text: "Bindings are supercool.",
        visible: false
      });
      coherent.dataModel.setValueForKey(this.context, "context");
    });

    it("should set & update html", function() {
      var updatedHTML= "Some new <i>HTML</i>.";
      var view= new coherent.View('view', {
        htmlBinding: 'context.html'
      });
    
      expect(view.node).toHaveHtml(this.context.html);
      this.context.setValueForKey(updatedHTML, "html");
      expect(view.node).toHaveHtml(updatedHTML);
    });
    
    it("should set & update text", function() {
      var updatedText= "My new text";
      var view= new coherent.View('view', {
        textBinding: 'context.text'
      });
      
      expect(view.node).toHaveText(this.context.text);
      this.context.setValueForKey(updatedText, "text");
      expect(view.node).toHaveText(updatedText);
    });
   
  });
});