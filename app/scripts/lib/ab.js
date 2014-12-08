// Stub AB if it failed to load
if(typeof AB === 'undefined') {
  AB = {
    subject: {},
    choose: function () {},
    report: function () { return [] }
  };
}
