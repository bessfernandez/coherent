describe("Model ToMany relations", function() {

  beforeEach(function(){
    coherent.Model._resetModels();
  });
  
  it("setting to-one inverse adds to to-many relation", function() {
  
    var Person= Model("Person", {
      cars: Model.ToMany({
              type: "Car",
              inverse: "owner"
            })
    });
    
    var Car= Model("Car", {
      owner: Model.ToOne({
              type: "Person",
              inverse: "cars"
            })
    });
    
  });
});