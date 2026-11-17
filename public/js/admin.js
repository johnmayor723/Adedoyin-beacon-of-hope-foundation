(function () {
  var csrf = document.querySelector('meta[name=csrf]').content;
  function $(s, r) { return (r || document).querySelector(s); }

  // ----- repeatable lists -----
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (t.matches('[data-add]')) {
      var wrap = t.closest('.listfield'), list = $('.list', wrap), tpl = $('template', wrap);
      var n = Date.now().toString(36) + Math.floor(Math.random() * 99);
      var div = document.createElement('div'); div.innerHTML = tpl.innerHTML.replace(/__i__/g, 'n' + n);
      var item = div.firstElementChild; list.appendChild(item); item.scrollIntoView({ block: 'center', behavior: 'smooth' });
      var first = item.querySelector('input[type=text],textarea'); if (first) first.focus();
    } else if (t.matches('[data-remove]')) {
      if (confirm('Remove this item?')) t.closest('.item').remove();
    } else if (t.matches('[data-up]')) {
      var it = t.closest('.item'); if (it.previousElementSibling) it.parentNode.insertBefore(it, it.previousElementSibling);
    } else if (t.matches('[data-down]')) {
      var it2 = t.closest('.item'); if (it2.nextElementSibling) it2.parentNode.insertBefore(it2.nextElementSibling, it2);
    } else if (t.closest('.item-bar') && !t.closest('button')) {
      t.closest('.item').classList.toggle('collapsed');
    } else if (t.matches('[data-clear]')) {
      setImage(t.closest('.imgf'), '');
    } else if (t.matches('[data-pick]')) {
      openPicker(t.closest('.imgf'));
    }
  });

  // live item titles
  document.addEventListener('input', function (e) {
    var item = e.target.closest && e.target.closest('.item'); if (!item) return;
    var title = $('.item-title', item), key = title.dataset.key;
    if (key && e.target.name && e.target.name.slice(-key.length - 2) === '[' + key + ']') title.textContent = e.target.value || 'New item';
  });

  // on submit: renumber list items in visual order so order = what you see
  document.querySelectorAll('[data-editor]').forEach(function (form) {
    form.addEventListener('submit', function () {
      form.querySelectorAll('.list').forEach(function (list) {
        var prefix = list.dataset.name;
        Array.prototype.forEach.call(list.children, function (item, i) {
          var old = prefix + '[' + item.dataset.idx + ']', neu = prefix + '[' + i + ']';
          item.querySelectorAll('[name]').forEach(function (el) { if (el.name.indexOf(old) === 0) el.name = neu + el.name.slice(old.length); });
          item.dataset.idx = i;
        });
      });
    });
  });

  // ----- images -----
  function setImage(box, url) {
    $('input[type=hidden]', box).value = url;
    var img = $('img', box), ph = $('.ph', box);
    if (url) { img.src = url; img.hidden = false; ph.hidden = true; } else { img.removeAttribute('src'); img.hidden = true; ph.hidden = false; }
  }
  document.addEventListener('change', function (e) {
    if (!e.target.matches('[data-upload]')) return;
    var file = e.target.files[0]; if (!file) return;
    var box = e.target.closest('.imgf'), fd = new FormData(); fd.append('file', file);
    var lbl = e.target.closest('label'); var old = lbl.firstChild.textContent; lbl.firstChild.textContent = 'Uploading…';
    fetch('/admin/upload', { method: 'POST', headers: { 'x-csrf-token': csrf }, body: fd })
      .then(function (r) { return r.ok ? r.json() : r.text().then(function (t) { throw new Error(t); }); })
      .then(function (j) { setImage(box, j.url); })
      .catch(function (err) { alert('Upload failed: ' + (err.message || err).toString().slice(0, 200)); })
      .finally(function () { lbl.firstChild.textContent = old; e.target.value = ''; });
  });

  var modal, target;
  function openPicker(box) {
    target = box;
    if (!modal) {
      modal = document.createElement('div'); modal.className = 'modal';
      modal.innerHTML = '<div class="modal-in"><header><strong>Choose an image</strong><button type="button" class="btn btn-light btn-sm" data-close>Close</button></header><div class="mgrid"></div></div>';
      document.body.appendChild(modal);
      modal.addEventListener('click', function (e) {
        if (e.target === modal || e.target.matches('[data-close]')) modal.classList.remove('on');
        else if (e.target.tagName === 'IMG') { setImage(target, e.target.dataset.url); modal.classList.remove('on'); }
      });
    }
    var grid = $('.mgrid', modal); grid.textContent = 'Loading…'; modal.classList.add('on');
    fetch('/admin/media').then(function (r) { return r.json(); }).then(function (urls) {
      grid.textContent = '';
      urls.forEach(function (u) { var im = document.createElement('img'); im.src = u; im.dataset.url = u; im.loading = 'lazy'; grid.appendChild(im); });
    });
  }

  // confirm buttons
  document.addEventListener('click', function (e) {
    var c = e.target.closest && e.target.closest('[data-confirm]');
    if (c && !confirm(c.dataset.confirm)) e.preventDefault();
  }, true);
})();
