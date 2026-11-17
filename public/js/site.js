(function () {
  var nav = document.getElementById('nav');
  var onScroll = function () { nav.classList.toggle('scrolled', window.scrollY > 8); };
  onScroll(); window.addEventListener('scroll', onScroll, { passive: true });

  // scroll reveal
  var els = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    els.forEach(function (el) { io.observe(el); });
  } else { els.forEach(function (el) { el.classList.add('in'); }); }

  // lightbox
  var lb = document.createElement('div'); lb.className = 'lb'; lb.innerHTML = '<img alt="">';
  document.body.appendChild(lb);
  lb.addEventListener('click', function () { lb.classList.remove('on'); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') lb.classList.remove('on'); });
  document.querySelectorAll('[data-lightbox]').forEach(function (img) {
    img.addEventListener('click', function () { lb.firstChild.src = img.src; lb.firstChild.alt = img.alt; lb.classList.add('on'); });
  });

  // close mobile menu after tapping a link
  document.querySelectorAll('.menu a').forEach(function (a) { a.addEventListener('click', function () { nav.classList.remove('open'); }); });
})();
