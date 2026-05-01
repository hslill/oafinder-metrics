let data = null;

document.addEventListener("DOMContentLoaded", () => {
  const reloadBtn = document.getElementById("reloadDataBtn");
  const downloadJsonBtn = document.getElementById("downloadJsonBtn");
  const saveDataBtn = document.getElementById("saveDataBtn");
  const dataStatus = document.getElementById("dataStatus");

  const journalSearchInput = document.getElementById("journalSearchInput");
  const journalsTableContainer = document.getElementById("journalsTableContainer");
  const dealsTableContainer = document.getElementById("dealsTableContainer");

  const rawJsonEditor = document.getElementById("rawJsonEditor");
  const applyRawJsonBtn = document.getElementById("applyRawJsonBtn");
  const rawJsonStatus = document.getElementById("rawJsonStatus");

  const csvFileInput = document.getElementById("csvFileInput");
  const importCsvBtn = document.getElementById("importCsvBtn");
  const exportCsvBtn = document.getElementById("exportCsvBtn");
  const csvStatus = document.getElementById("csvStatus");

  // JOURNAL DETAILS PANEL (Add + Edit)
  const journalDetailsPanel = document.getElementById("journalDetailsPanel");
  const journalDetailsForm = document.getElementById("journalDetailsForm");
  const journalDetailsIndexInput = document.getElementById("journalDetailsIndex");
  const journalDetailsTitleInput = document.getElementById("journalDetailsTitle");
  const journalDetailsPublisherInput = document.getElementById("journalDetailsPublisher");
  const journalDetailsISSNInput = document.getElementById("journalDetailsISSN");
  const journalDetailsEISSNInput = document.getElementById("journalDetailsEISSN");
  const journalDetailsDealIdInput = document.getElementById("journalDetailsDealId");
  const journalDetailsTermsInput = document.getElementById("journalDetailsTerms");
  const journalDetailsStatus = document.getElementById("journalDetailsStatus");
  const cancelJournalDetailsBtn = document.getElementById("cancelJournalDetailsBtn");
  const addJournalBtn = document.getElementById("addJournalBtn");

  // DEAL DETAILS PANEL (Add + Edit)
  const dealDetailsPanel = document.getElementById("dealDetailsPanel");
  const dealDetailsForm = document.getElementById("dealDetailsForm");
  const dealDetailsIndexInput = document.getElementById("dealDetailsIndex");
  const dealDetailsIdInput = document.getElementById("dealDetailsId");
  const dealDetailsPublisherInput = document.getElementById("dealDetailsPublisher");
  const dealDetailsTypeInput = document.getElementById("dealDetailsType");
  const dealDetailsCoverageInput = document.getElementById("dealDetailsCoverage");
  const dealDetailsRenewalInput = document.getElementById("dealDetailsRenewal");
  const dealDetailsCostInput = document.getElementById("dealDetailsCost");
  const dealDetailsEligibleInput = document.getElementById("dealDetailsEligible");
  const dealDetailsScopeInput = document.getElementById("dealDetailsScope");
  const dealDetailsModelInput = document.getElementById("dealDetailsModel");
  const dealDetailsDetailsInput = document.getElementById("dealDetailsDetails");
  const dealDetailsStatus = document.getElementById("dealDetailsStatus");
  const cancelDealDetailsBtn = document.getElementById("cancelDealDetailsBtn");
  const addDealBtn = document.getElementById("addDealBtn");

  const loadBackupBtn = document.getElementById("loadBackupBtn");
  const metricsStatus = document.getElementById("metricsStatus");
  const metricsContent = document.getElementById("metricsContent");
  const metricsTotalEvents = document.getElementById("metricsTotalEvents");
  const metricsTableBody = document.querySelector("#metricsTable tbody");

  // ---------------- Helper functions for server interaction ----------------
if (!metricsStatus || !metricsTotalEvents || !metricsTableBody) {
    return;
  }

  // Adjust this URL to your Vercel project
  const METRICS_ENDPOINT =
    window.__OAFINDER_METRICS_ENDPOINT__ ||
    "https://<your-vercel-project>.vercel.app/api/oafinder-metrics";

  fetch(METRICS_ENDPOINT, { cache: "no-store" })
    .then((response) => {
      if (!response.ok) throw new Error("Failed to load metrics");
      return response.json();
    })
    .then((data) => {
      metricsStatus.textContent = "Metrics loaded.";
      metricsContent.style.display = "block";

      metricsTotalEvents.textContent = data.totalEvents || 0;

      const modes = data.modes || {};
      metricsTableBody.innerHTML = "";

      Object.keys(modes)
        .sort()
        .forEach((mode) => {
          const row = document.createElement("tr");
          const m = modes[mode];

          row.innerHTML = `
            <td>${mode}</td>
            <td>${m.total}</td>
            <td>${m.helpfulTrue}</td>
            <td>${m.helpfulFalse}</td>
            <td>${m.helpfulNull}</td>
          `;
          metricsTableBody.appendChild(row);
        });
    })
    .catch((error) => {
      console.error("Metrics error:", error);
      metricsStatus.textContent =
        "Unable to load metrics. Please try again later.";
    });
});

  // ---------------- Helper functions ----------------

loadBackupBtn.addEventListener("click", async () => {
  dataStatus.textContent = "Loading backup list...";
  dataStatus.style.color = "#555";

  try {
    const files = await fetch("/api/backups").then(r => r.json());
    if (!files.length) {
      dataStatus.textContent = "No backups found on server.";
      dataStatus.style.color = "orange";
      return;
    }

    const choice = window.prompt(
      "Available backups:\n" +
      files.map((f, i) => `${i + 1}. ${f}`).join("\n") +
      "\n\nEnter the number of the backup to load:"
    );
    if (!choice) return;
    const index = Number(choice) - 1;
    if (!Number.isInteger(index) || index < 0 || index >= files.length) {
      dataStatus.textContent = "Invalid selection.";
      dataStatus.style.color = "red";
      return;
    }

    const name = files[index];
    dataStatus.textContent = `Loading backup ${name}...`;
    const backupData = await fetch(`/api/backups/${encodeURIComponent(name)}`).then(r => r.json());

    data = backupData;
    dataStatus.textContent = `Loaded backup: ${name} (not yet saved as live content.json).`;
    dataStatus.style.color = "green";
    refreshViews();
  } catch (e) {
    console.error(e);
    dataStatus.textContent = "Error loading backup.";
    dataStatus.style.color = "red";
  }
});

  // ===== Load / refresh =====
  function loadData() {
    dataStatus.textContent = "Loading...";
    dataStatus.style.color = "#555";

    fetch("/api/content", { cache: "no-cache" })
      .then(r => r.json())
      .then(json => {
        data = json;
        dataStatus.textContent = "Loaded.";
        dataStatus.style.color = "green";
        refreshViews();
      })
      .catch(err => {
        console.error(err);
        dataStatus.textContent = "Error loading /api/content";
        dataStatus.style.color = "red";
      });
  }

  function refreshViews() {
    if (!data) return;
    renderJournalsTable();
    renderDealsTable();

    if (rawJsonEditor) {
      rawJsonEditor.value = JSON.stringify(data, null, 2);
    }
    hideJournalDetailsPanel();
    hideDealDetailsPanel();
  }

  // ===== Journals listing =====
  function renderJournalsTable() {
    if (!data || !data.journals_index) return;
    const journals = data.journals_index;
    const filter = (journalSearchInput.value || "").toLowerCase();

    const filtered = journals.filter(j => {
      const title = (j.TITLE || j.journal_title || "").toLowerCase();
      const pub = (j["Journal Publisher"] || j.publisher || "").toLowerCase();
      const issn = ((j.ISSN || j.issn_print || "") + (j.eISSN || j.issn_online || "")).toLowerCase();
      return !filter || title.includes(filter) || pub.includes(filter) || issn.includes(filter);
    });

    let html = `<table class="editor-table journals-table">
  <thead>
    <tr>
      <th class="col-title">Title</th>
      <th class="col-publisher">Publisher</th>
      <th class="col-issn">ISSN</th>
      <th class="col-issn">eISSN</th>
      <th class="col-dealid">Deal ID</th>
      <th class="col-actions"></th>
    </tr>
  </thead><tbody>`;

    filtered.forEach(j => {
      const originalIndex = journals.indexOf(j);
      html += `
        <tr data-index="${originalIndex}">
          <td>${j.TITLE || j.journal_title || ""}</td>
          <td>${j["Journal Publisher"] || j.publisher || ""}</td>
          <td>${j.ISSN || j.issn_print || ""}</td>
          <td>${j.eISSN || j.issn_online || ""}</td>
          <td>${j.deal_id || ""}</td>
          <td>
            <button data-action="edit" class="search-btn" type="button">Edit</button>
            <button data-action="delete" class="search-btn clear-btn" type="button">Delete</button>
          </td>
        </tr>`;
    });

    html += `</tbody></table>`;
    journalsTableContainer.innerHTML = html;

    journalsTableContainer.querySelectorAll("button[data-action]").forEach(btn => {
      btn.addEventListener("click", () => {
        const tr = btn.closest("tr");
        const idx = Number(tr.dataset.index);
        const action = btn.dataset.action;
        const journal = data.journals_index[idx];

        if (action === "delete") {
          if (confirm(`Delete journal "${journal.TITLE || journal.journal_title}"?`)) {
            data.journals_index.splice(idx, 1);
            refreshViews();
          }
        } else if (action === "edit") {
          startEditJournal(journal, idx);
        }
      });
    });
  }

  // ===== Journal details panel (Add + Edit) =====
  function showJournalDetailsPanel() {
    journalDetailsPanel.style.display = "block";
    journalDetailsPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function hideJournalDetailsPanel() {
    journalDetailsPanel.style.display = "none";
    journalDetailsStatus.textContent = "";
    journalDetailsForm.reset();
    journalDetailsIndexInput.value = "";
  }

  function startEditJournal(journal, index) {
    journalDetailsIndexInput.value = String(index);
    journalDetailsTitleInput.value = journal.TITLE || journal.journal_title || "";
    journalDetailsPublisherInput.value = journal["Journal Publisher"] || journal.publisher || "";
    journalDetailsISSNInput.value = journal.ISSN || journal.issn_print || "";
    journalDetailsEISSNInput.value = journal.eISSN || journal.issn_online || "";
    journalDetailsDealIdInput.value = journal.deal_id || "";
    journalDetailsTermsInput.value = journal.Terms || journal.cost_to_author || "";
    journalDetailsStatus.textContent = "";
    showJournalDetailsPanel();
  }

  journalDetailsForm.addEventListener("submit", e => {
    e.preventDefault();
    if (!data) return;
    data.journals_index = data.journals_index || [];

    const idxStr = journalDetailsIndexInput.value;
    const isNew = idxStr === "";
    const idx = isNew ? data.journals_index.length : Number(idxStr);

    const title = journalDetailsTitleInput.value.trim();
    if (!title) {
      journalDetailsStatus.textContent = "Title is required.";
      journalDetailsStatus.style.color = "red";
      return;
    }

    const publisher = journalDetailsPublisherInput.value.trim();
    const issn = journalDetailsISSNInput.value.trim();
    const eissn = journalDetailsEISSNInput.value.trim();
    const dealId = journalDetailsDealIdInput.value.trim();
    const terms = journalDetailsTermsInput.value.trim();

    const j = data.journals_index[idx] || {};

    j.TITLE = title;
    delete j.journal_title;
    j["Journal Publisher"] = publisher;
    delete j.publisher;
    j.ISSN = issn;
    j.eISSN = eissn;
    j.deal_id = dealId;
    if (terms) {
      j.Terms = terms;
      delete j.cost_to_author;
    }

    if (isNew) data.journals_index.push(j);
    else data.journals_index[idx] = j;

    journalDetailsStatus.textContent = isNew
      ? "Journal added (not yet saved to server)."
      : "Journal updated (not yet saved to server).";
    journalDetailsStatus.style.color = "green";

    renderJournalsTable();
  });

  cancelJournalDetailsBtn.addEventListener("click", hideJournalDetailsPanel);

  addJournalBtn.addEventListener("click", () => {
    journalDetailsForm.reset();
    journalDetailsIndexInput.value = "";
    journalDetailsStatus.textContent = "";
    showJournalDetailsPanel();
  });

  // ===== Deals listing =====
  function renderDealsTable() {
    if (!data || !data.publishing_deals) return;
    const deals = data.publishing_deals;

    let html = `<table class="editor-table deals-table">
  <thead>
    <tr>
      <th class="col-dealid">Deal ID</th>
      <th class="col-publisher">Publisher</th>
      <th class="col-type">Type</th>
      <th class="col-coverage">Coverage</th>
      <th class="col-renewal">Renewal</th>
      <th class="col-actions"></th>
    </tr>
  </thead><tbody>`;

    deals.forEach((d, idx) => {
      html += `
        <tr data-index="${idx}">
          <td>${d.deal_id || ""}</td>
          <td>${d.publisher || ""}</td>
          <td>${d.type || ""}</td>
          <td>${d.coverage || ""}</td>
          <td>${d.renewal_date || ""}</td>
          <td>
            <button data-action="edit" class="search-btn" type="button">Edit</button>
            <button data-action="delete" class="search-btn clear-btn" type="button">Delete</button>
          </td>
        </tr>`;
    });

    html += `</tbody></table>`;
    dealsTableContainer.innerHTML = html;

    dealsTableContainer.querySelectorAll("button[data-action]").forEach(btn => {
      btn.addEventListener("click", () => {
        const tr = btn.closest("tr");
        const idx = Number(tr.dataset.index);
        const action = btn.dataset.action;
        const deal = data.publishing_deals[idx];

        if (action === "delete") {
          if (confirm(`Delete deal "${deal.deal_id}" (${deal.publisher})?`)) {
            data.publishing_deals.splice(idx, 1);
            refreshViews();
          }
        } else if (action === "edit") {
          startEditDeal(deal, idx);
        }
      });
    });
  }

  // ===== Deal details panel (Add + Edit) =====
  function showDealDetailsPanel() {
    dealDetailsPanel.style.display = "block";
    dealDetailsPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function hideDealDetailsPanel() {
    dealDetailsPanel.style.display = "none";
    dealDetailsStatus.textContent = "";
    dealDetailsForm.reset();
    dealDetailsIndexInput.value = "";
  }

  function startEditDeal(deal, index) {
    dealDetailsIndexInput.value = String(index);
    dealDetailsIdInput.value = deal.deal_id || "";
    dealDetailsPublisherInput.value = deal.publisher || "";
    dealDetailsTypeInput.value = deal.type || "";
    dealDetailsCoverageInput.value = deal.coverage || "";
    dealDetailsRenewalInput.value = deal.renewal_date || "";
    dealDetailsCostInput.value = deal.cost_to_author || "";
    dealDetailsEligibleInput.value = deal.eligible_authors || "";
    dealDetailsScopeInput.value = deal.journal_scope || "";
    dealDetailsModelInput.value = deal.model || "";
    dealDetailsDetailsInput.value = deal.details || "";
    dealDetailsStatus.textContent = "";
    showDealDetailsPanel();
  }

  dealDetailsForm.addEventListener("submit", e => {
    e.preventDefault();
    if (!data) return;
    data.publishing_deals = data.publishing_deals || [];

    const idxStr = dealDetailsIndexInput.value;
    const isNew = idxStr === "";
    const idx = isNew ? data.publishing_deals.length : Number(idxStr);

    const dealId = dealDetailsIdInput.value.trim();
    const publisher = dealDetailsPublisherInput.value.trim();
    if (!dealId || !publisher) {
      dealDetailsStatus.textContent = "Deal ID and Publisher are required.";
      dealDetailsStatus.style.color = "red";
      return;
    }

    const d = data.publishing_deals[idx] || {};

    d.deal_id = dealId;
    d.publisher = publisher;
    d.type = dealDetailsTypeInput.value.trim();
    d.coverage = dealDetailsCoverageInput.value.trim();
    d.renewal_date = dealDetailsRenewalInput.value.trim();
    d.cost_to_author = dealDetailsCostInput.value.trim();
    d.eligible_authors = dealDetailsEligibleInput.value.trim();
    d.journal_scope = dealDetailsScopeInput.value.trim();
    d.model = dealDetailsModelInput.value.trim();
    d.details = dealDetailsDetailsInput.value.trim();

    if (isNew) data.publishing_deals.push(d);
    else data.publishing_deals[idx] = d;

    dealDetailsStatus.textContent = isNew
      ? "Deal added (not yet saved to server)."
      : "Deal updated (not yet saved to server).";
    dealDetailsStatus.style.color = "green";

    renderDealsTable();
  });

  cancelDealDetailsBtn.addEventListener("click", hideDealDetailsPanel);

  addDealBtn.addEventListener("click", () => {
    dealDetailsForm.reset();
    dealDetailsIndexInput.value = "";
    dealDetailsStatus.textContent = "";
    showDealDetailsPanel();
  });

  // ===== Save to server =====
  function saveToServer() {
    if (!data) return;
    dataStatus.textContent = "Saving...";
    dataStatus.style.color = "#555";

    fetch("/api/content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    })
      .then(r => r.json())
      .then(resp => {
        if (resp.status === "ok") {
          dataStatus.textContent = `Saved. Backup: ${resp.backupFile || "none"}`;
          dataStatus.style.color = "green";
        } else {
          dataStatus.textContent = `Save error: ${resp.message || "unknown"}`;
          dataStatus.style.color = "red";
        }
      })
      .catch(err => {
        console.error(err);
        dataStatus.textContent = "Network/server error while saving.";
        dataStatus.style.color = "red";
      });
  }

  // ===== Raw JSON / CSV (optional, keep your implementations) =====
  if (applyRawJsonBtn && rawJsonEditor) {
    applyRawJsonBtn.addEventListener("click", () => {
      try {
        const parsed = JSON.parse(rawJsonEditor.value);
        data = parsed;
        rawJsonStatus.textContent = "Applied to editor state.";
        rawJsonStatus.style.color = "green";
        refreshViews();
      } catch (e) {
        rawJsonStatus.textContent = "Invalid JSON: " + e.message;
        rawJsonStatus.style.color = "red";
      }
    });
  }

  if (importCsvBtn && csvFileInput) {
    importCsvBtn.addEventListener("click", async () => {
      if (!csvFileInput.files.length || !data) {
        csvStatus.textContent = "Choose a CSV file first.";
        csvStatus.style.color = "red";
        return;
      }
      try {
        const text = await csvFileInput.files[0].text();
        const parsed = parseCSV(text);
        const { headers, rows } = parsed;
        if (!headers.includes("TITLE") || !headers.includes("Journal Publisher") || !headers.includes("Terms")) {
          throw new Error("Missing required columns: TITLE, Journal Publisher, Terms.");
        }
        data.journals_index = data.journals_index || [];
        rows.forEach(r => data.journals_index.push(r));
        csvStatus.textContent = `Imported ${rows.length} rows.`;
        csvStatus.style.color = "green";
        refreshViews();
      } catch (e) {
        csvStatus.textContent = "Error: " + e.message;
        csvStatus.style.color = "red";
      }
    });
  }

  if (exportCsvBtn) {
    exportCsvBtn.addEventListener("click", () => {
      if (!data || !data.journals_index) return;
      const headers = ["TITLE","Journal Publisher","Terms","ISSN","eISSN","deal_id"];
      const lines = [headers.join(",")];
      data.journals_index.forEach(j => {
        const row = [
          j.TITLE || j.journal_title || "",
          j["Journal Publisher"] || j.publisher || "",
          j.Terms || j.cost_to_author || "",
          j.ISSN || j.issn_print || "",
          j.eISSN || j.issn_online || "",
          j.deal_id || ""
        ];
        lines.push(row.map(v => `"${(v || "").replace(/"/g,'""')}"`).join(","));
      });
      const blob = new Blob([lines.join("\n")], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "journals_export.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }

  // Simple CSV parser
  function parseCSV(csvText) {
    const lines = csvText.trim().split("\n");
    if (lines.length < 2) return { headers: [], rows: [] };
    const headers = lines[0].split(",").map(h => h.trim().replace(/"/g, ""));
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const values = lines[i].split(",").map(v => v.trim().replace(/"/g, ""));
      const row = {};
      headers.forEach((h, idx) => (row[h] = values[idx] || ""));
      rows.push(row);
    }
    return { headers, rows };
  }

  // Wire up top-level buttons
  reloadBtn.addEventListener("click", loadData);
  downloadJsonBtn.addEventListener("click", () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "content.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
  saveDataBtn.addEventListener("click", saveToServer);
  journalSearchInput.addEventListener("input", renderJournalsTable);

  // Initial load
  loadData();
});

const saveDataBtn = document.getElementById("saveDataBtn");
const saveStatus = document.getElementById("saveStatus");

function saveToServer() {
  if (!data) return;
  saveStatus.textContent = "Saving...";
  saveStatus.style.color = "#555";

  fetch("/api/content", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  })
    .then(r => r.json())
    .then(resp => {
      if (resp.status === "ok") {
        saveStatus.textContent = `Saved. Backup: ${resp.backupFile || "none"}`;
        saveStatus.style.color = "green";
      } else {
        saveStatus.textContent = `Save error: ${resp.message || "unknown"}`;
        saveStatus.style.color = "red";
      }
    })
    .catch(err => {
      console.error(err);
      saveStatus.textContent = "Network/server error while saving.";
      saveStatus.style.color = "red";
    });
}

saveDataBtn.addEventListener("click", saveToServer);