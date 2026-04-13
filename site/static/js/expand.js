document.addEventListener('DOMContentLoaded', function () {
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
});
