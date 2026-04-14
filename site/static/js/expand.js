document.addEventListener('DOMContentLoaded', function () {
  // Essay expand/collapse
  document.querySelectorAll('[data-expand-btn]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var body = btn.previousElementSibling;
      while (body && !body.hasAttribute('data-expandable')) {
        body = body.previousElementSibling;
      }
      if (!body) return;
      body.classList.add('expanded');
    });
  });

  // TOC bar: show after scrolling past the poem section
  var tocBar = document.getElementById('toc-bar');
  var poem = document.getElementById('poem');
  if (tocBar && poem) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          tocBar.classList.remove('visible');
        } else {
          tocBar.classList.add('visible');
        }
      });
    }, { threshold: 0.1 });
    observer.observe(poem);
  }
});
