/* script.js
   Works across pages:
   - apply.html : submit application
   - status.html: query by reg no
   - admin.html : list, approve/reject, export, clear
   - index.html : hero buttons are links
*/

document.addEventListener('DOMContentLoaded', function () {

  const page = location.pathname.split('/').pop();

  // shared storage key
  const KEY = 'applications_v1';

  // utility: load & save
  function loadList() { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
  function saveList(list) { localStorage.setItem(KEY, JSON.stringify(list)); }

  // ---------------- Apply page ----------------
  if (page === 'apply.html') {
    const form = document.getElementById('applyForm');
    const msg = document.getElementById('applyMsg');
    const clearBtn = document.getElementById('clearBtn');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const data = {
        id: 'APP' + Date.now(),
        name: form.name.value.trim(),
        reg: form.reg.value.trim(),
        dept: form.dept.value.trim(),
        income: Number(form.income.value || 0),
        reason: form.reason.value.trim(),
        status: 'Pending',
        submitted: new Date().toISOString()
      };

      if (!data.name || !data.reg) {
        msg.textContent = 'Please fill name and register number.';
        msg.style.color = '#b33';
        return;
      }

      const list = loadList();
      list.push(data);
      saveList(list);

      msg.textContent = 'Application submitted successfully!';
      msg.style.color = 'green';
      form.reset();
    });

    clearBtn.addEventListener('click', function () {
      form.reset();
      document.getElementById('applyMsg').textContent = '';
    });
  }

  // ---------------- Status page ----------------
  if (page === 'status.html') {
    const sf = document.getElementById('statusForm');
    const out = document.getElementById('statusResult');

    sf.addEventListener('submit', function (e) {
      e.preventDefault();
      const q = document.getElementById('regq').value.trim();
      const list = loadList();
      const found = list.find(it => it.reg === q);

      if (!found) {
        out.innerHTML = '<div class="card"><b>No application found</b><div class="muted">Check your register number.</div></div>';
      } else {
        out.innerHTML = `
          <div class="card">
            <p><b>Name:</b> ${escapeHtml(found.name)}</p>
            <p><b>Register No:</b> ${escapeHtml(found.reg)}</p>
            <p><b>Department:</b> ${escapeHtml(found.dept)}</p>
            <p><b>Income:</b> ₹${Number(found.income).toLocaleString()}</p>
            <p><b>Status:</b> ${escapeHtml(found.status)}</p>
            <p class="muted">Submitted: ${new Date(found.submitted).toLocaleString()}</p>
          </div>
        `;
      }
    });
  }

  // ---------------- Admin page ----------------
  if (page === 'admin.html') {
    const listEl = document.getElementById('adminList');
    const exportBtn = document.getElementById('exportBtn');
    const clearAll = document.getElementById('clearAll');

    function render() {
      const list = loadList();
      listEl.innerHTML = '';
      if (list.length === 0) {
        listEl.innerHTML = '<p class="muted">No applications submitted yet.</p>'; return;
      }

      list.forEach((app, i) => {
        const div = document.createElement('div');
        div.className = 'card';
        div.innerHTML = `
          <p><b>${escapeHtml(app.name)}</b> <span class="muted">(${escapeHtml(app.reg)})</span></p>
          <p><b>Dept:</b> ${escapeHtml(app.dept)} &nbsp; <b>Income:</b> ₹${Number(app.income).toLocaleString()}</p>
          <p><b>Status:</b> <span id="st-${i}">${escapeHtml(app.status)}</span></p>
          <div style="margin-top:8px">
            <button onclick="approve(${i})" class="btn">Approve</button>
            <button onclick="reject(${i})" class="btn btn-ghost">Reject</button>
            <button onclick="del(${i})" class="btn btn-ghost">Delete</button>
          </div>
        `;
        listEl.appendChild(div);
      });
    }

    // export CSV
    exportBtn.addEventListener('click', function () {
      const list = loadList();
      if (!list.length) { alert('No applications to export'); return; }
      const rows = [['id','name','reg','dept','income','status','submitted']];
      list.forEach(r => rows.push([r.id, r.name, r.reg, r.dept, r.income, r.status, r.submitted]));
      const csv = rows.map(r => r.map(c => `"${(''+c).replace(/"/g,'""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], {type:'text/csv'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'applications.csv'; a.click();
      URL.revokeObjectURL(url);
    });

    clearAll.addEventListener('click', function () {
      if (!confirm('Clear all applications?')) return;
      saveList([]);
      render();
    });

    // attach global functions for onclick
    window.approve = function(i) {
      const list = loadList(); list[i].status = 'Approved'; saveList(list); document.getElementById('st-'+i).innerText = 'Approved';
    };
    window.reject = function(i) {
      const list = loadList(); list[i].status = 'Rejected'; saveList(list); document.getElementById('st-'+i).innerText = 'Rejected';
    };
    window.del = function(i) {
      const list = loadList(); if (!confirm('Delete this application?')) return; list.splice(i,1); saveList(list); render();
    };

    render();
  }

  // helper: escape html
  function escapeHtml(s) {
    if (!s) return '';
    return s.replace(/[&<>"']/g, function(m){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]; });
  }

});
