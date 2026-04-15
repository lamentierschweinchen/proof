document.addEventListener('DOMContentLoaded', function () {
  // Essay expand/collapse
  document.querySelectorAll('[data-expand-btn]').forEach(function (btn) {
    var body = btn.previousElementSibling;
    while (body && !body.hasAttribute('data-expandable')) {
      body = body.previousElementSibling;
    }
    if (!body) return;
    btn.addEventListener('click', function () {
      body.classList.add('expanded');
    });
  });

  var tocBar = document.getElementById('toc-bar');
  var poem = document.getElementById('poem');

  // TOC bar: show after scrolling past the poem section
  if (tocBar && poem) {
    var visibilityObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          tocBar.classList.remove('visible');
        } else {
          tocBar.classList.add('visible');
        }
      });
    }, { threshold: 0.1 });
    visibilityObserver.observe(poem);
  }

  // TOC bar: mark the section currently in view as active.
  if (tocBar) {
    var sectionIds = ['poem', 'rowan', 'ossian', 'correspondence'];
    var sections = sectionIds
      .map(function (id) { return document.getElementById(id); })
      .filter(Boolean);

    var linksById = {};
    tocBar.querySelectorAll('.toc-link').forEach(function (link) {
      var href = link.getAttribute('href') || '';
      if (href.charAt(0) === '#') {
        linksById[href.slice(1)] = link;
      }
    });

    function setActive(id) {
      Object.keys(linksById).forEach(function (key) {
        linksById[key].classList.toggle('toc-link--active', key === id);
      });
    }

    // Scroll-spy: the active section is the last one whose top has crossed
    // below the TOC bar. Keeps the highlighted link synced to the reader's
    // position without waiting for full intersection.
    var ticking = false;
    function updateActive() {
      var offset = (tocBar.offsetHeight || 44) + 24;
      var active = sections[0];
      for (var i = 0; i < sections.length; i++) {
        if (sections[i].getBoundingClientRect().top <= offset) {
          active = sections[i];
        } else {
          break;
        }
      }
      if (active) setActive(active.id);
    }
    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(function () {
          updateActive();
          ticking = false;
        });
        ticking = true;
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    updateActive();
  }
});
