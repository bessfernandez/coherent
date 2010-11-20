describe("Model ToOne relations", function() {

  it("should set inverse relation", function() {
    var M1= Model("Model1", {
      m2: Model.ToOne({
            type: "Model2",
            inverse: "m1"
          })
    });
    
    var M2= Model("Model2", {
      m1: Model.ToOne({
            type: "Model1",
            inverse: "m2"
          })
    });

    var m1= new M1();
    var m2= new M2();

    m1.setValueForKey(m2, 'm2');
    expect(m2.m1()).toBe(m1);
  });

});