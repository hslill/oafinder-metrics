let journalDeals = [];
let journalsIndex = [];
let enrichedJournals = [];
let journalBrowseRecords = [];
let searchableRecords = [];
// Subject browse pagination state (global to this module)
let currentBrowseSubject = null;
let currentBrowseList = [];
let currentBrowseRendered = 0;
const BROWSE_PAGE_SIZE = 50; // number of journals per "page"

// Feedback / metrics endpoint configuration
const FEEDBACK_ENDPOINT =
  (typeof window !== "undefined" && window.__OAFINDER_FEEDBACK_ENDPOINT__) ||
  "/api/metrics/feedback";

const placeholderThumbnail =
  "https://openlibrary.org/images/icons/avatar_book-sm.png";
const currentDate = new Date();
const nlmLookupCache = new Map();

function loadContentData() {
  const embedded = getEmbeddedContentData();
  if (embedded) {
    return Promise.resolve(embedded);
  }

  return fetch("/api/content", { cache: "no-cache" }).then((response) => {
    if (!response.ok) throw new Error("Failed to load content.json");
    return response.json();
  });
}

function getEmbeddedContentData() {
  if (
    typeof window !== "undefined" &&
    window.__OAFINDER_EMBEDDED_CONTENT__ &&
    typeof window.__OAFINDER_EMBEDDED_CONTENT__ === "object"
  ) {
    return window.__OAFINDER_EMBEDDED_CONTENT__;
  }

  const embeddedScript = document.getElementById("oafinderEmbeddedContent");
  if (!embeddedScript) return null;

  try {
    return JSON.parse(embeddedScript.textContent || "{}");
  } catch (error) {
    console.error("Failed to parse embedded OAFinder content.", error);
    return null;
  }
}

const SUBJECT_DEFINITIONS = [
  {
    id: "allergy-immunology",
    label: "Allergy & Immunology",
    keywords: [
      "allergy",
      "allergic",
      "immunol",
      "immune",
      "hypersensitivity",
      "asthma",
      "atopic",
    ],
  },
  {
    id: "anesthesiology",
    label: "Anesthesiology",
    keywords: ["anesth", "analgesia", "perioperative"],
  },
  {
    id: "cardiology",
    label: "Cardiology",
    keywords: [
      "cardio",
      "cardiac",
      "heart",
      "coronary",
      "arrhythmia",
      "myocardial",
    ],
  },
  {
    id: "dermatology",
    label: "Dermatology",
    keywords: [
      "dermatol",
      "skin",
      "cutaneous",
      "psoriasis",
      "eczema",
      "melanoma",
    ],
  },
  {
    id: "digital-health",
    label: "Digital health",
    keywords: [
      "digital",
      "informatics",
      "artificial intelligence",
      " ai ",
      "machine learning",
      "data science",
    ],
  },
  {
    id: "endocrinology",
    label: "Endocrinology",
    keywords: [
      "endocrin",
      "endocrine",
      "hormone",
      "thyroid",
      "pituitary",
      "diabetes",
      "metabolism",
      "metabolic",
    ],
  },
  {
    id: "gastroenterology-hepatology",
    label: "Gastroenterology & Hepatology",
    keywords: [
      "gastroenterol",
      "gastro",
      "hepatol",
      "liver",
      "hepatitis",
      "digestive",
      "bowel",
      "colorectal",
      "intestinal",
      "gut",
    ],
  },
  {
    id: "general-medicine",
    label: "General medicine",
    keywords: [
      "medicine",
      "medical",
      "clinical",
      "case report",
      "case reports",
      "health",
    ],
  },
  {
    id: "genetics",
    label: "Genetics",
    keywords: [
      "genetic",
      "genetics",
      "genome",
      "genomic",
      "hereditary",
      "inheritance",
    ],
  },
  {
    id: "geriatrics",
    label: "Geriatrics",
    keywords: [
      "geriatr",
      "gerontol",
      "aging",
      "ageing",
      "older adult",
      "old age",
    ],
  },
  {
    id: "hematology",
    label: "Hematology",
    keywords: [
      "hematol",
      "haematol",
      "blood",
      "leukemia",
      "lymphoma",
      "anemia",
    ],
  },
  {
    id: "infectious-disease",
    label: "Infectious disease",
    keywords: [
      "infectious disease",
      "infection",
      "infect",
      "antimicrob",
      "antibiotic",
      "antiviral",
      "parasit",
      "tropical medicine",
    ],
  },
  {
    id: "mental-health",
    label: "Mental health",
    keywords: [
      "psych",
      "psychiat",
      "mental health",
      "psychotherapy",
      "abuse",
      "neglect",
    ],
  },
  {
    id: "microbiology",
    label: "Microbiology",
    keywords: [
      "microbio",
      "microbial",
      "bacter",
      "virol",
      "infect",
      "pathogen",
    ],
  },
  {
    id: "nephrology",
    label: "Nephrology",
    keywords: ["nephrol", "kidney", "renal", "dialysis", "glomerul"],
  },
  {
    id: "neurology",
    label: "Neurology",
    keywords: ["neuro", "brain", "stroke", "epilep"],
  },
  {
    id: "nursing",
    label: "Nursing",
    keywords: ["nursing", "nurse", "midwifery", "midwife"],
  },
  {
    id: "obgyn",
    label: "OB-GYN",
    keywords: [
      "obstet",
      "gyne",
      "maternal",
      "fetal",
      "reproductive",
      "women",
      "pregnan",
      "neonatal",
    ],
  },
  {
    id: "oncology",
    label: "Oncology",
    keywords: [
      "oncolog",
      "cancer",
      "carcinom",
      "tumor",
      "tumour",
      "neoplasm",
      "chemotherapy",
      "radiotherapy",
    ],
  },
    {
  id: "ophthalmology",
  label: "Ophthalmology",
  keywords: [
    "ophthalmol",   // Ophthalmology, ophthalmologic
    "ocular",       // Ocular, ocular disease, etc.
    "retina",       // Retina, retinal
    "retinal",
    "glaucoma",
    "cataract",     // Cataract, cataracts
    "cornea",       // Cornea, corneal
    "vision research",       // Vision, visual impairment, etc.
    "vision loss",       // Vision loss, visual impairment, etc.
    "vision health",       // Vision health, eye health, etc.
    "vision care",       // Vision care, eye care, etc.
    "visual acuity",
    "visual attention",
    "blindness",
    "blind",
    "brain, vision, memory",       // Brain, vision, memory, etc.
    "visual processing", 
    "computational vision",
    "eye and vision",       // Eye and vision, etc.
    "vision, image",
    "signal processing",
    "visual neuroscience",
    "visual perception",
    "visual cognition",
    "visual attention",
    "visual impairment",
    "visual function",
    "visual communication",
    "visual literacy",
    "peripheral vision",
    "clinical electrophysiology of vision",       // Clinical electrophysiology, etc.
    "recognition memory and eye movement",       // Recognition memory, eye movement, etc.
    "recognition in vision",       // Recognition, vision, etc.
    "current eye",          // Eye, eye disease, etc.
    "eye research",       // Eye research, etc.
    "eye disorder",       // Eye disorder, etc.
    "eye condition",       // Eye condition, etc.
    "eye health",       // Eye health, etc.
    "eye care",       // Eye care, etc.
    "ophthalmology research",       // Ophthalmology research, etc.
    "ophthalmology disease",       // Ophthalmology disease, etc.
    "ophthalmology condition",       // Ophthalmology condition, etc.
    "ophthalmology health",       // Ophthalmology health, etc.
    "ophthalmology care",       // Ophthalmology care, etc.
    "ophthalmology disorder",       // Ophthalmology disorder, etc.
    "ophthalmology treatment",       // Ophthalmology treatment, etc.
    "ophthalmology therapy",       // Ophthalmology therapy, etc.
    "ophthalmology clinic",       // Ophthalmology clinic, etc.
    "ophthalmology hospital",       // Ophthalmology hospital, etc.
    "ophthalmology patient",       // Ophthalmology patient, etc.
    "ophthalmology study",       // Ophthalmology study, etc.
    "eye disease",       // Eye disease, etc.
    "genetic eye disease",       // Genetic eye disease, etc.
  ],
},
  {
    id: "orthopedics",
    label: "Orthopedics",
    keywords: [
      "orthop",
      "orthopaedic",
      "orthopedic",
      "bone",
      "spine",
      "joint",
      "musculoskeletal",
    ],
  },
  {
    id: "otolaryngology",
    label: "Otolaryngology (ENT)",
    keywords: [
      "otolaryngol",
      "ent",
      "ear nose throat",
      "otology",
      "laryngology",
      "rhinolog",
      "sinus",
      "sinusitis",
    ],
  },
  {
    id: "pediatrics",
    label: "Pediatrics",
    keywords: ["pediatr", "child", "children", "adolescent", "neonatal"],
  },
  {
    id: "pulmonology-critical-care",
    label: "Pulmonology & Critical care",
    keywords: [
      "pulmonol",
      "respiratory",
      "lung",
      "bronch",
      "airway",
      "copd",
      "critical care",
      "intensive care",
      "icu",
      "ventilation",
    ],
  },
  {
    id: "public-health",
    label: "Public health",
    keywords: [
      "public health",
      "epidemiology",
      "population",
      "global health",
      "health systems",
    ],
  },
  {
    id: "radiology",
    label: "Radiology",
    keywords: [
      "radiology",
      "radiolog",
      "imaging",
      "ct",
      "mri",
      "x ray",
      "x-ray",
    ],
  },
  {
    id: "rehabilitation",
    label: "Rehabilitation",
    keywords: ["rehab", "rehabil", "assistive", "disability"],
  },
  {
    id: "rheumatology",
    label: "Rheumatology",
    keywords: [
      "rheumatol",
      "arthritis",
      "arthrit",
      "lupus",
      "spondyloarth",
      "connective tissue disease",
    ],
  },
  {
    id: "surgery",
    label: "Surgery",
    keywords: [
      "surgery",
      "surgical",
      "arthro",
      "orthop",
      "bone",
      "joint",
      "trauma",
    ],
  },
  {
    id: "toxicology",
    label: "Toxicology",
    keywords: ["toxic", "poison"],
  },
];

const SUPPORT_NEEDS = [
  { id: "agreement_lookup", label: "Agreement lookup" },
  { id: "fellowship", label: "Fellowship code" },
  { id: "discount_code", label: "Discount code" },
  { id: "journal_match", label: "Find covered alternatives" },
  { id: "indexing", label: "PubMed or PMC indexing" }
];

const PUBLISHER_DIRECTORY = [
  { name: "BMJ", aliases: ["bmj", "bmj case reports", "bmj digital health"] },
  {
    name: "Springer Nature",
    aliases: [
      "springer",
      "springer nature",
      "bmc",
      "biomed central",
      "springeropen",
      "scientific reports",
    ],
  },
  {
    name: "Taylor & Francis",
    aliases: [
      "taylor and francis",
      "taylor & francis",
      "tandf",
      "clinical toxicology",
    ],
  },
  { name: "Wiley", aliases: ["wiley", "wiley open access account", "woaa"] },
  { name: "Elsevier", aliases: ["elsevier", "neuroimage"] },
  {
    name: "SAGE",
    aliases: ["sage", "sage journals", "women's health reports"],
  },
  { name: "JMIR", aliases: ["jmir"] },
  { name: "Frontiers", aliases: ["frontiers", "frontier journals"] },
  {
    name: "American Society for Microbiology",
    aliases: ["asm", "american society for microbiology"],
  },
  {
    name: "Cambridge University Press",
    aliases: ["cambridge", "cambridge university press"],
  },
  { name: "PLOS", aliases: ["plos"] },
  { name: "Karger", aliases: ["karger"] },
];

const SUPPORT_TOPICS = [
  {
    id: "bmj-fellowship",
    title: "BMJ Case Reports fellowship support",
    prompt:
      "Does NYU have an institutional fellowship for BMJ Case Reports and what should I do if the code does not work?",
    supportType: "fellowship",
    benefitType: "fellowship",
    keywords: [
      "bmj",
      "case reports",
      "fellowship",
      "fellowship code",
      "institutional fellowship"
    ],
    dealIds: ["bmj_case_reports"],
    actions: [
      "Confirm the submission is using NYU affiliation and the corresponding author is eligible.",
      "Use the fellowship code listed in the BMJ Case Reports deal card when submitting.",
      "If BMJ rejects the code, contact the library before buying a personal fellowship."
    ]
  },
  {
    id: "apc-guidance",
    title: "APC help and fee guidance",
    prompt: "Does NYU help with article processing charges or discounts?",
    supportType: "apc_help",
    keywords: [
      "apc",
      "article processing charge",
      "article processing charges",
      "fees",
      "funding",
      "publication fee",
      "discount",
      "waiver"
    ],
    actions: [
      "Look for a current library deal before paying an invoice.",
      "Check whether the journal is fully covered, partially discounted, or requires a special workflow.",
      "If the journal is not listed, contact the library for publisher-specific guidance."
    ]
  },
    {
  id: "agreement-status",
  title: "Publisher says the agreement is capped or inactive",
  prompt:
    "The publisher says our institutional allowance or annual cap has been reached, or that the agreement is inactive. What should I do, and who manages this?",
  supportType: "cap_limit",
  benefitType: "conditional",
  keywords: [
    "cap", "cap reached", "allowance", "annual cap",
    "inactive agreement", "agreement inactive", "limit reached"
  ],
  actions: [
    "Pause before paying and save any emails or invoices that mention caps, allowances, or inactive agreements.",
    "Review the language in the publisher’s message or contract. Look for terms such as 'annual cap', 'allowance', 'transformative agreement', or 'read and publish'.",
    "Visit the NYU Libraries Open Knowledge page to request a consultation about your publishing agreement and options.",
    "You may also contact the NYU Health Sciences Library for help understanding how the agreement relates to your authorship and any NYU-funded publishing support.",
    "Do not pay an invoice or APC until you have confirmed whether the agreement still covers your article and who is responsible for any costs."
  ],
  links: [
    {
      label: "NYU Libraries Open Knowledge",
      url: "https://library.nyu.edu/departments/open-knowledge/"
    },
    {
      label: "NYU Health Sciences Library open access support",
      url: "https://hslguides.med.nyu.edu/collectiondevelopment/apcs"  // adjust if needed
    }
  ]
},
  {
    id: "discount-code",
    title: "Discount code",
    prompt:
      "Do I need a discount code, RightsLink code, or special institutional workflow for this journal?",
    supportType: "discount_code",
    keywords: [
      "discount code",
      "rightslink",
      "code",
      "workflow",
      "coupon",
      "special instructions"
    ],
    actions: [
      "Check the publisher deal card for fellowship codes, exclusions, and special instructions.",
      "Use institutional email and affiliation at submission and again at acceptance.",
      "If the publisher asks for payment before the agreement is applied, contact the library with the invoice."
    ]
  },
  {
    id: "subject-match",
    title: "Find covered journals in a subject area",
    prompt:
      "Show me covered journals in a subject area and recommend alternatives if a journal is not included.",
    supportType: "journal_match",
    keywords: [
      "subject",
      "subject area",
      "recommend",
      "other journals",
      "alternative",
      "journal match",
      "mental health",
      "psychiatry",
      "surgery",
      "obgyn"
    ],
    actions: [
      "Use the subject filter to browse journals within a discipline.",
      "If your target journal is not listed, review the covered alternatives section.",
      "Compare benefit type, publisher workflow, and journal indexing before choosing an alternative."
    ]
  },
  {
    id: "pubmed-pmc",
    title: "PubMed and PubMed Central indexing",
    prompt: "Is this journal indexed in PubMed or PubMed Central?",
    supportType: "indexing",
    keywords: [
      "pubmed",
      "pubmed central",
      "pmc",
      "indexed",
      "indexing",
      "nlm catalog"
    ],
    actions: [
      "Use the NLM Catalog check in each journal result to review live indexing details when available.",
      "Treat local subject tags as guidance, but rely on NLM indexing data for final confirmation.",
      "If the live lookup is unavailable, open the direct NLM Catalog search link from the journal card."
    ]
  }
];

const DEAL_BADGE_LABELS = {
  full: "No-cost coverage",
  discount: "Discount available",
  fellowship: "Fellowship or code",
  conditional: "Special workflow",
};

document.addEventListener("DOMContentLoaded", () => {
  const elements = {
    form: document.getElementById("searchForm"),
    keyword: document.getElementById("keyword"),
    clearBtn: document.getElementById("clearBtn"),
    resultsArea: document.getElementById("resultsArea"),
    resultsList: document.getElementById("resultsList"),
    resultsPlaceholder: document.getElementById("resultsPlaceholder"),
    resultsCountBadge: document.getElementById("resultsCountBadge"),
    resultsSummary: document.getElementById("resultsSummary"),
    lastUpdated: document.getElementById("lastUpdated"),
    titleIndexContainer: document.getElementById("titleIndexContainer"),
    publisherIndexContainer: document.getElementById("publisherIndexContainer"),
    dealSummaryContainer: document.getElementById("dealSummaryContainer"),
    subjectIndexContainer: document.getElementById("subjectIndexContainer"),
    supportTopicContainer: document.getElementById("supportTopicContainer"),
    topicChips: document.getElementById("topicChips"),
    subjectFilter: document.getElementById("subjectFilter"),
    supportFilter: document.getElementById("supportFilter"),
    benefitFilter: document.getElementById("benefitFilter"),
    resultsTitle: document.getElementById("resultsTitle"),
    resultsModePill: document.getElementById("resultsModePill"),
    feedbackPromptContainer: document.getElementById("feedbackPromptContainer"),
  };

  populateSelect(elements.subjectFilter, SUBJECT_DEFINITIONS, "All subjects");
  populateSelect(elements.supportFilter, SUPPORT_NEEDS, "All support types");
  renderTopicChips(elements.topicChips, applySupportTopic);

  loadContentData()
    .then((data) => {
      journalDeals = (data.publishing_deals || []).map(normalizeDeal);
      journalsIndex = data.journals_index || [];
      enrichedJournals = journalsIndex.map((rawJournal) =>
        normalizeJournal(rawJournal, journalDeals),
      );
      journalBrowseRecords = enrichedJournals.filter(
        (journal) => journal.recordType === "journal",
      );
      searchableRecords = enrichedJournals.filter((journal) =>
        isSearchableRecordType(journal.recordType),
      );

      renderLastUpdated(elements.lastUpdated, data.last_updated);

      buildTitleIndex(elements.titleIndexContainer, (journal) => {
        showJournalDetails(journal, elements);
      });

      buildPublisherIndex(elements.publisherIndexContainer, (publisherName) => {
        // Clear search input and filters when browsing by publisher to avoid confusion, since publisher deals can cover multiple journals and subjects
        setControlsFromState(
          { query: "", subjectId: "", supportType: "", benefitType: "" },
          elements,
        );
        showPublisherDeals(publisherName, elements);
      });

      // Subjects browse → filter + search
      buildSubjectIndex(elements.subjectIndexContainer, subjectId => {
  const nextState = buildState(
    {
      query: "",
      subjectId,
      supportType: "",
      benefitType: "",
      publisherName: ""
    },
    elements
  );
  setControlsFromState(nextState, elements);
  runSearch(nextState, elements);
});

      buildSupportTopicIndex(elements.supportTopicContainer, applySupportTopic);

      buildDealSummary(elements.dealSummaryContainer, deal => {
  showSingleDeal(deal, elements);
});

      initAccordionBehavior();
    })
    .catch((error) => {
      console.error(error);
      if (elements.resultsPlaceholder) {
        elements.resultsArea.style.display = "block";
        elements.resultsPlaceholder.innerHTML =
          '<p style="color:red;">Error loading journal data. Please try again later.</p>';
      }
    });

  function applySupportTopic(topicId) {
    const topic = SUPPORT_TOPICS.find((item) => item.id === topicId);
    if (!topic) return;
    const inferredSubject =
      topic.subjectId || inferSubjectsFromText(topic.prompt, false)[0] || "";
    const nextState = buildState(
      {
        query: topic.prompt,
        subjectId: inferredSubject,
        supportType: topic.supportType || "",
        benefitType: topic.benefitType || "",
      },
      elements,
    );

    setControlsFromState(nextState, elements);
    runSearch(nextState, elements);
  }

  if (elements.form) {
    elements.form.addEventListener("submit", (event) => {
      event.preventDefault();
      const state = buildState({}, elements);
      runSearch(state, elements);
    });
  }

  // Subject filter: subject-only browse when changed
if (elements.subjectFilter) {
  elements.subjectFilter.addEventListener("change", () => {
    const state = buildState(
      {
        query: "",
        subjectId: elements.subjectFilter.value,
        supportType: "",
        benefitType: "",
        publisherName: ""
      },
      elements
    );
    setControlsFromState(state, elements);
    runSearch(state, elements);
  });
}

// Support + benefit filters: treat browse selections as a fresh browse search
[elements.supportFilter, elements.benefitFilter].forEach(control => {
  if (!control) return;
  control.addEventListener("change", () => {
    const state = buildState(
      {
        query: "",
        publisherName: ""
      },
      elements
    );
    setControlsFromState(state, elements);
    runSearch(state, elements);
  });
});

  if (elements.clearBtn) {
    elements.clearBtn.addEventListener("click", () => clearSearch(elements));
  }
});

function setResultsMode(elements, config) {
  if (
    !elements.resultsTitle ||
    !elements.resultsModePill ||
    !elements.resultsCountBadge
  ) {
    return;
  }

  const {
    title = "Search Results",
    modeLabel = "",
    badgeText = "",
    modeClass = ""
  } = config || {};

  elements.resultsTitle.textContent = title;

  // Reset mode pill classes
  elements.resultsModePill.classList.remove(
    "mode-support",
    "mode-coverage",
    "mode-browse",
    "mode-search"
  );

  if (modeLabel) {
    elements.resultsModePill.textContent = `Mode: ${modeLabel}`;
    elements.resultsModePill.style.display = "inline-block";

    if (modeClass) {
      elements.resultsModePill.classList.add(modeClass);
    }
  } else {
    elements.resultsModePill.textContent = "";
    elements.resultsModePill.style.display = "none";
  }

  if (badgeText) {
    elements.resultsCountBadge.textContent = badgeText;
  }
}

function populateSelect(select, items, defaultLabel) {
  if (!select) return;
  select.innerHTML = `<option value="">${defaultLabel}</option>`;
  items.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.id;
    option.textContent = item.label;
    select.appendChild(option);
  });
}

function renderLastUpdated(target, lastUpdated) {
  // if (!target || !lastUpdated) return;
 // target.textContent = `Last updated ${formatDate(lastUpdated)}.`;
}

function initAccordionBehavior() {
  document.querySelectorAll(".accordion-header").forEach((button) => {
    button.addEventListener("click", () => {
      const parent = button.closest(".accordion-item");
      document.querySelectorAll(".accordion-item").forEach((item) => {
        if (item !== parent) item.classList.remove("active");
      });
      const isActive = parent.classList.toggle("active");
      document.querySelectorAll(".accordion-item").forEach((item) => {
        const icon = item.querySelector(".accordion-icon");
        if (icon)
          icon.textContent = item.classList.contains("active") ? "-" : "+";
      });
      const badge = document.querySelector(".results-header .accordion-badge");
      if (!badge) return;
      if (!isActive) {
        badge.textContent = "";
        return;
      }
      const target = button.dataset.target;
      badge.textContent =
        target === "journalsAccordionBody"
          ? "Journal Browser"
          : target === "publishersAccordionBody"
            ? "Publisher Browser"
            : target === "subjectsAccordionBody"
              ? "Subject Browser"
              : target === "supportAccordionBody"
                ? "Support Topics"
                : "Deal Summary";
    });
  });
}

function normalizeDeal(deal) {
  const normalized = {
    ...deal,
    deal_id: cleanText(deal.deal_id || ""),
    publisher: cleanText(deal.publisher || ""),
    sub_publisher: cleanText(deal.sub_publisher || ""),
    type: cleanText(deal.type || ""),
    renewal_date: cleanText(deal.renewal_date || ""),
    coverage: cleanText(deal.coverage || ""),
    cost_to_author: cleanText(deal.cost_to_author || ""),
    eligible_authors: cleanText(deal.eligible_authors || ""),
    journal_scope: cleanText(deal.journal_scope || ""),
    model: cleanText(deal.model || ""),
    details: cleanText(deal.details || ""),
    contact_email: cleanText(deal.contact_email || ""),
    fellowship_code: cleanText(deal.fellowship_code || ""),
    special_instructions: (deal.special_instructions || []).map(cleanText),
    restrictions: (deal.restrictions || []).map(cleanText),
    links: (deal.links || []).map((link) => ({
      label: cleanText(link.label || ""),
      url: cleanText(link.url || ""),
    })),
  };

  normalized.searchBlob = normalizeForSearch(
    [
      normalized.publisher,
      normalized.sub_publisher,
      normalized.type,
      normalized.coverage,
      normalized.cost_to_author,
      normalized.eligible_authors,
      normalized.journal_scope,
      normalized.model,
      normalized.details,
      normalized.special_instructions.join(" "),
      normalized.restrictions.join(" "),
    ].join(" "),
  );
  normalized.benefitType = deriveBenefitType(
    normalized.cost_to_author,
    normalized.coverage,
    normalized.fellowship_code,
    normalized.details,
  );
  normalized.status = deriveDealStatus(normalized.renewal_date);
  normalized.nextSteps = buildDealNextSteps(normalized);
  return normalized;
}

function normalizeJournal(rawJournal, deals) {
  const title = cleanText(rawJournal.TITLE || rawJournal.journal_title || "");
  const publisher = cleanText(
    rawJournal["Journal Publisher"] || rawJournal.publisher || "Unknown",
  );
  const issnPrint = cleanText(rawJournal.ISSN || rawJournal.issn_print || "");
  const issnOnline = cleanText(
    rawJournal.eISSN || rawJournal.issn_online || "",
  );
  const isbn = cleanText(rawJournal.ISBN || rawJournal.isbn || "");
  const publicationType = cleanText(rawJournal.publication_type || "");
  const publicationDate = cleanText(
    rawJournal["Publication Date"] || rawJournal.publication_date || "",
  );
  const costToAuthor = cleanText(
    rawJournal.Terms || rawJournal.cost_to_author || "",
  );
  const coverage = cleanText(rawJournal.coverage || "");
  const dealId = cleanText(rawJournal.deal_id || "");
  const deal = deals.find((item) => item.deal_id === dealId) || null;
  const recordType = classifyRecordType(publicationType, issnPrint, issnOnline, isbn);
  const isMonograph = recordType === "monograph";
  const isJournal = recordType === "journal";
  const isSerial = recordType === "journal" || recordType === "magazine";
  const hasLiveNlmLookup =
    recordType === "journal"
      ? Boolean(issnPrint || issnOnline || title)
      : recordType === "magazine"
        ? Boolean(issnPrint || issnOnline)
        : false;

  const subjectIds = inferSubjectsFromText(
    [
      title,
      publisher,
      publicationType,
      coverage,
      costToAuthor,
      deal ? `${deal.publisher} ${deal.journal_scope} ${deal.details}` : "",
    ].join(" "),
    true,
  );

  const benefitType = deriveBenefitType(
    deal?.cost_to_author || costToAuthor,
    deal?.coverage || coverage,
    deal?.fellowship_code || "",
    deal?.details || "",
  );

  const journal = {
    id:
          normalizeForSearch(`${title}-${issnPrint}-${issnOnline}-${isbn}`) ||
    String(Math.random()),
    journal_name: title,
    titleNormalized: normalizeForSearch(title),
    publisher,
    publisherNormalized: normalizeForSearch(publisher),
    issn_print: issnPrint,
    issnPrintNormalized: normalizeIdentifier(issnPrint),
    issn_online: issnOnline,
    issnOnlineNormalized: normalizeIdentifier(issnOnline),
    isbn, // NEW
    isbnNormalized: normalizeIdentifier(isbn),
    publicationType, // NEW
    publicationDate, // NEW
    recordType,
    isMonograph, // NEW
    isJournal,
    isSerial,
    coverage: deal?.coverage || coverage,
    cost_to_author: deal?.cost_to_author || costToAuthor,
    deal_id: dealId,
    deal,
    benefitType,
    benefitLabel:
      DEAL_BADGE_LABELS[benefitType] || "Agreement details available",
    subjectIds,
    subjectLabels: subjectIds.map((subjectId) => getSubjectLabel(subjectId)),
    searchBlob: normalizeForSearch(
      [
        title,
        publisher,
        issnPrint,
        issnOnline,
        isbn, // include ISBN in search
        publicationType,
        coverage,
        costToAuthor,
        deal ? `${deal.publisher} ${deal.details} ${deal.journal_scope}` : "",
      ].join(" "),
    ),
    nlmCatalogUrl: buildNlmCatalogUrl(title, issnPrint || issnOnline),
    nextSteps: buildJournalNextSteps(deal, benefitType),
    hasLiveNlmLookup,
  };

  return journal;
}

function classifyRecordType(publicationType, issnPrint, issnOnline, isbn) {
  const normalizedType = cleanText(publicationType).toLowerCase();
  const hasIssn = Boolean(cleanText(issnPrint) || cleanText(issnOnline));
  const hasIsbn = Boolean(cleanText(isbn));

  if (hasIsbn || normalizedType === "monographs") return "monograph";
  if (normalizedType === "magazine") return "magazine";
  if (normalizedType === "conferences") return "conference";
  if (normalizedType === "journal articles" || normalizedType === "journal") {
    return "journal";
  }
  if (hasIssn) return "journal";
  return "other";
}

function isSearchableRecordType(recordType) {
  return ["journal", "monograph", "magazine"].includes(recordType);
}

function getRecordTypeLabel(recordType) {
  switch (recordType) {
    case "journal":
      return "Journal";
    case "monograph":
      return "Monograph";
    case "magazine":
      return "Magazine";
    case "conference":
      return "Conference proceeding";
    default:
      return "Publication";
  }
}

function getDefaultRecordTag(recordType) {
  switch (recordType) {
    case "journal":
      return "General journal";
    case "monograph":
      return "Book / monograph";
    case "magazine":
      return "Magazine";
    case "conference":
      return "Conference proceeding";
    default:
      return "Publication record";
  }
}

function getRecordIdentifierSummary(journal) {
  return [
    journal.issn_print ? `ISSN ${journal.issn_print}` : "",
    journal.issn_online ? `eISSN ${journal.issn_online}` : "",
    journal.isbn ? `ISBN ${journal.isbn}` : "",
  ]
    .filter(Boolean)
    .join(" | ");
}

function deriveDealStatus(renewalDate) {
  // Temporary behavior: ignore renewalDate and always show a neutral message.
 
   return {
    tone: "neutral",
    label: "Details"
  };

/*
  // Original logic for when you want to re-enable date-based status:

  if (!renewalDate) {
    return { tone: "neutral", label: "Check current status with library" };
  }

  const renewal = new Date(renewalDate);
  if (Number.isNaN(renewal.getTime())) {
    return { tone: "neutral", label: "Renewal date listed" };
  }
  if (renewal < currentDate) {
    return {
      tone: "warning",
      label: `Renewal date passed on ${formatDate(renewalDate)}`,
    };
  }
  return { tone: "active", label: `Active through ${formatDate(renewalDate)}` };
  */
}

function deriveBenefitType(costToAuthor, coverage, fellowshipCode, details) {
  const combined = normalizeForSearch(
    [costToAuthor, coverage, details, fellowshipCode].join(" "),
  );
  if (fellowshipCode || combined.includes("fellowship")) return "fellowship";
  if (
    combined.includes("discount") ||
    combined.includes("member rate") ||
    combined.includes("partial")
  )
    return "discount";
  if (
    combined.includes("no cost") ||
    coverage === "100%" ||
    combined.includes("100")
  )
    return "full";
  return "conditional";
}

function buildDealNextSteps(deal) {
  const steps = [];
  if (deal.fellowship_code) {
    steps.push(
      `Use fellowship code ${deal.fellowship_code} during submission.`,
    );
  }
  if (deal.special_instructions.length) {
    steps.push(...deal.special_instructions);
  }
  if (deal.eligible_authors) {
    steps.push(`Confirm eligibility: ${deal.eligible_authors}.`);
  }
  if (deal.contact_email) {
    steps.push(`Questions can be routed to ${deal.contact_email}.`);
  }
  if (!steps.length) {
    steps.push(
      "Use NYU affiliation and institutional email, then confirm agreement workflow before paying.",
    );
  }
  return uniqueValues(steps);
}

function buildJournalNextSteps(deal, benefitType) {
  if (deal?.nextSteps?.length) {
    return deal.nextSteps;
  }
  if (benefitType === "full") {
    return [
      "Confirm the corresponding author and institutional email meet the agreement requirements.",
    ];
  }
  if (benefitType === "discount") {
    return ["Verify the discount is applied before paying the APC invoice."];
  }
  if (benefitType === "fellowship") {
    return [
      "Use the required fellowship code before purchasing anything individually.",
    ];
  }
  return [
    "Contact the library if the publisher workflow is unclear or the invoice does not match the expected benefit.",
  ];
}

function buildTitleIndex(container, onSelect) {
  if (!container || !journalBrowseRecords.length) return;
  const grouped = {};
  journalBrowseRecords
    .slice()
    .sort((left, right) => left.journal_name.localeCompare(right.journal_name))
    .forEach((journal) => {
      const letter = journal.journal_name.charAt(0).toUpperCase() || "#";
      if (!grouped[letter]) grouped[letter] = [];
      grouped[letter].push(journal);
    });

  container.innerHTML = "";
  Object.keys(grouped)
    .sort()
    .forEach((letter) => {
      const heading = document.createElement("h3");
      heading.textContent = letter;
      container.appendChild(heading);

      const list = document.createElement("ul");
      grouped[letter].forEach((journal) => {
        const item = document.createElement("li");
        item.textContent = journal.journal_name;
        item.addEventListener("click", () => onSelect(journal));
        list.appendChild(item);
      });
      container.appendChild(list);
    });
}

function buildPublisherIndex(container, onSelect) {
  if (!container || !journalDeals.length) return;
  const publishers = uniqueValues(
    journalDeals.map((deal) => deal.publisher),
  ).sort((left, right) => left.localeCompare(right));
  const list = document.createElement("ul");
  publishers.forEach((publisher) => {
    const item = document.createElement("li");
    item.textContent = publisher;
    item.addEventListener("click", () => onSelect(publisher));
    list.appendChild(item);
  });
  container.innerHTML = "";
  container.appendChild(list);
}

function buildSubjectIndex(container, onSelect) {
  if (!container) return;
  const counts = SUBJECT_DEFINITIONS.map((subject) => ({
    ...subject,
    count: journalBrowseRecords.filter((journal) =>
      journal.subjectIds.includes(subject.id),
    ).length,
  })).filter((subject) => subject.count > 0);

  const list = document.createElement("ul");
  counts.forEach((subject) => {
    const item = document.createElement("li");
    item.innerHTML = `<span>${subject.label}</span><span class="browse-count">${subject.count}</span>`;
    item.addEventListener("click", () => onSelect(subject.id));
    list.appendChild(item);
  });

  container.innerHTML = "";
  container.appendChild(list);
}

function buildSupportTopicIndex(container, onSelect) {
  if (!container) return;
  const list = document.createElement("ul");
  SUPPORT_TOPICS.forEach((topic) => {
    const item = document.createElement("li");
    item.innerHTML = `<span>${topic.title}</span><span class="browse-count">${getSupportLabel(topic.supportType)}</span>`;
    item.addEventListener("click", () => onSelect(topic.id));
    list.appendChild(item);
  });
  container.innerHTML = "";
  container.appendChild(list);
}

function buildDealSummary(container, onSelect) {
  if (!container || !journalDeals.length) return;
  const list = document.createElement("ul");
  journalDeals.forEach((deal) => {
    const item = document.createElement("li");
    item.innerHTML = `
      <div class="deal-listing">
        <strong>${escapeHtml(deal.publisher)}</strong>
        <span>${escapeHtml(deal.coverage || "Coverage varies")}</span>
        <span>${escapeHtml(deal.status.label)}</span>
      </div>
    `;
    item.addEventListener("click", () => onSelect(deal));
    list.appendChild(item);
  });
  container.innerHTML = "";
  container.appendChild(list);
}

function renderTopicChips(container, onSelect) {
  if (!container) return;
  container.innerHTML = "";
  SUPPORT_TOPICS.forEach((topic) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "topic-chip";
    button.textContent = topic.title;
    button.addEventListener("click", () => onSelect(topic.id));
    container.appendChild(button);
  });
}

function buildState(overrides = {}, elements) {
  const keywordInput = elements?.keyword || document.getElementById("keyword");
  const subjectFilter =
    elements?.subjectFilter || document.getElementById("subjectFilter");
  const supportFilter =
    elements?.supportFilter || document.getElementById("supportFilter");
  const benefitFilter =
    elements?.benefitFilter || document.getElementById("benefitFilter");

  return {
    query:
      overrides.query !== undefined
        ? overrides.query
        : (keywordInput?.value || "").trim(),
    subjectId:
      overrides.subjectId !== undefined
        ? overrides.subjectId
        : subjectFilter?.value || "",
    supportType:
      overrides.supportType !== undefined
        ? overrides.supportType
        : supportFilter?.value || "",
    benefitType:
      overrides.benefitType !== undefined
        ? overrides.benefitType
        : benefitFilter?.value || "",
    publisherName:
      overrides.publisherName !== undefined
        ? overrides.publisherName
        : overrides.publisherName === ""
          ? ""
          : "", // explicit in overrides only
  };
}

function setControlsFromState(state, elements) {
  if (elements.keyword) elements.keyword.value = state.query || "";
  if (elements.subjectFilter)
    elements.subjectFilter.value = state.subjectId || "";
  if (elements.supportFilter)
    elements.supportFilter.value = state.supportType || "";
  if (elements.benefitFilter)
    elements.benefitFilter.value = state.benefitType || "";
}

function hasActiveCriteria(state) {
  return Boolean(
    state.query ||
    state.subjectId ||
    state.supportType ||
    state.benefitType ||
    state.publisherName,
  );
}

function clearSearch(elements) {
  setControlsFromState(
    buildState({ query: "", subjectId: "", supportType: "", benefitType: "" }),
    elements
  );

  if (
    !elements.resultsArea ||
    !elements.resultsList ||
    !elements.resultsPlaceholder ||
    !elements.resultsCountBadge ||
    !elements.resultsSummary
  ) {
    return;
  }

  elements.resultsArea.style.display = "none";
  elements.resultsList.innerHTML = "";
  elements.resultsList.style.display = "none";
  elements.resultsPlaceholder.style.display = "block";
  elements.resultsPlaceholder.innerHTML =
    '<p class="text-muted mb-0">Enter a journal or publication title, publisher, subject, or question to begin.</p>';
  elements.resultsSummary.innerHTML = "";
  history.replaceState(null, "", window.location.pathname);

  // reset mode/title/badge when clearing
  setResultsMode(elements, {
  title: "Search Results",
  modeLabel: "",
  badgeText: "0 results",
});
}

function runSupportOnlySearch(state, analysis, elements) {
  const supportMatches = matchSupportTopics(state, analysis);

  // Deals linked to support topics (optional, only when you want them)
  const topicDealIds = new Set(
    supportMatches.flatMap(topic => topic.dealIds || [])
  );
  const dealMatches = journalDeals.filter(deal => topicDealIds.has(deal.deal_id));

  // Summary for the support question
  const parts = [];
  if (state.supportType) {
    parts.push(
      `<p>Support need: <strong>${escapeHtml(getSupportLabel(state.supportType))}</strong>.</p>`
    );
  }
  if (state.query) {
    parts.push(
      `<p>Question: <strong>${escapeHtml(state.query)}</strong></p>`
    );
  }
  if (!supportMatches.length && !dealMatches.length) {
    parts.push(
      "<p>No specific guidance or linked agreements were found for this support need. Please contact the library.</p>"
    );
  }

  setResultsMode(elements, {
  title: "Support Guidance",
  modeLabel: "Support topics",
  badgeText: "Support",
  modeClass: "mode-support",
});

  elements.resultsSummary.innerHTML = parts.join("");

  // Render support cards (and optionally deals), but do not show a numeric result count
  elements.resultsList.innerHTML = "";
  let totalCards = 0;

  if (supportMatches.length) {
    totalCards += supportMatches.length;
    elements.resultsList.appendChild(renderSectionHeader("Support guidance"));
    supportMatches.forEach(topic => {
      elements.resultsList.appendChild(renderSupportCard(topic));
    });
  }

  // If you DO NOT want deals in support topics, comment this block out
  // If you do, you can leave it, or guard it as you already do
  /*
  if (state.publisherName && dealMatches.length) {
    totalCards += dealMatches.length;
    elements.resultsList.appendChild(
      renderSectionHeader("Related publisher agreements")
    );
    dealMatches.forEach(deal => {
      elements.resultsList.appendChild(renderDealCard(deal));
    });
  }
  */

    if (!totalCards) {
    elements.resultsList.style.display = "none";
    elements.resultsPlaceholder.style.display = "block";
    elements.resultsPlaceholder.innerHTML =
      '<p class="text-muted mb-0">No specific guidance was found for this support need. Please contact the library for assistance.</p>';
  } else {
    elements.resultsList.style.display = "block";
    elements.resultsPlaceholder.style.display = "none";
  }

  // NEW: feedback prompt for support mode
  renderFeedbackPrompt(elements, {
    mode: "support",
    hasResults: totalCards > 0,
    state,
  });
}

function isCoverageQuestion(query, analysis) {
  const normalized = normalizeForSearch(query);
  if (!normalized) return false;

  // Key coverage question cues
  const coverageWords = ["cover", "covered", "agreement", "agreements", "deal", "deals", "pay", "fund"];

  const mentionsCoverage = coverageWords.some((word) =>
  normalized.includes(` ${word} `)
);
  const mentionsNyu = normalized.includes(" nyu ");

  const hasPublisherMatch = analysis.publishers && analysis.publishers.length > 0;

  // Coverage question if it mentions coverage/agreement AND either NYU or a known publisher
  return (mentionsCoverage && mentionsNyu) || (mentionsCoverage && hasPublisherMatch);
}

function runCoverageQuestionSearch(state, analysis, elements) {
  const publishers = analysis.publishers || [];
  const publisherNames = publishers.map(p => p.name);

  // Find deals whose publisher matches one of the recognized names
  const normalizedNames = publisherNames.map(name => normalizeForSearch(name));
  const deals = journalDeals.filter(deal =>
    normalizedNames.includes(normalizeForSearch(deal.publisher))
  );

  const parts = [];

  if (state.query) {
    parts.push(
      `<p>Searching for "<strong>${escapeHtml(state.query)}</strong>".</p>`
    );
  }

  if (publisherNames.length) {
    parts.push(
      `<p>Publisher detected: <strong>${escapeHtml(publisherNames.join(", "))}</strong>.</p>`
    );
  }

  if (deals.length) {
    // Positive coverage answer
    parts.push(
      `<p><strong>Coverage answer:</strong> NYU has open access agreements with this publisher. See the agreements below for details.</p>`
    );
  } else {
    // No coverage found → Coverage Advisor-style guidance
    const names = publisherNames.length
      ? publisherNames.join(", ")
      : "This publisher";

    parts.push(`
      <div class="coverage-advisor">
        <h4>Coverage Advisor</h4>
        <p><strong>${escapeHtml(names)}</strong> does not appear in our current open access agreement list for this search.</p>
        <ul>
          <li>Pause before paying any APC or invoice.</li>
          <li>Use the Subject filter to look for covered alternatives in the same discipline.</li>
          <li>Contact the NYU Health Sciences Library for publisher-specific guidance.</li>
        </ul>
      </div>
    `);
  }

  elements.resultsSummary.innerHTML = parts.join("");

  setResultsMode(elements, {
  title: "Coverage Answer",
  modeLabel: "Coverage question",
  badgeText: deals.length
    ? `${deals.length} agreement${deals.length !== 1 ? "s" : ""}`
    : "Coverage",
  modeClass: "mode-coverage",
});
renderFeedbackPrompt(elements, {
  mode: "coverage",
  hasResults: deals.length > 0,
  state,
});
  // Render only publisher deal cards (if any)
  elements.resultsList.innerHTML = "";
  let totalCards = 0;

  if (deals.length) {
    totalCards += deals.length;
    elements.resultsList.appendChild(
      renderSectionHeader("Publisher agreement details")
    );
    deals.forEach(deal => {
      elements.resultsList.appendChild(renderDealCard(deal));
    });
    elements.resultsList.style.display = "block";
  } else {
    elements.resultsList.style.display = "none";
  }
}

function runSearch(state, elements) {
  if (
    !elements.resultsArea ||
    !elements.resultsList ||
    !elements.resultsPlaceholder ||
    !elements.resultsCountBadge ||
    !elements.resultsSummary
  ) {
    return;
  }

  if (!hasActiveCriteria(state)) {
    clearSearch(elements);
    return;
  }

  elements.resultsArea.style.display = "block";
  elements.resultsArea.scrollTop = 0;
  window.scrollTo({
    top: elements.resultsArea.offsetTop - 80,
    behavior: "smooth"
  });
  elements.resultsList.style.display = "block";
  elements.resultsPlaceholder.style.display = "none";
  elements.resultsList.innerHTML = "";
  elements.resultsSummary.innerHTML = "";

  const analysis = analyzeQuery(state.query);

  // 1) Support mode – if supportType set, route to Support Topics
  if (state.supportType) {
    runSupportOnlySearch(state, analysis, elements);
    return;
  }

  // 2) Coverage question mode – e.g., "Does NYU cover Wiley?"
  if (isCoverageQuestion(state.query, analysis)) {
    runCoverageQuestionSearch(state, analysis, elements);
    return;
  }

  // 3) Subject-only: subject set, no query/support/benefit/publisher
  const isSubjectOnly =
    !state.query &&
    state.subjectId &&
    !state.supportType &&
    !state.benefitType &&
    !state.publisherName;

  if (isSubjectOnly) {
    runSubjectBrowse(state, elements);
    return;
  }

  // 4) Normal publication search path (journals/monographs only)
  const journalMatches = findJournalMatches(state, analysis);

  const resultLabel = journalMatches.some(
    (journal) => journal.recordType !== "journal"
  )
    ? "publication"
    : "journal";

  const parts = [];
  if (state.query) {
    parts.push(`Searching for "${escapeHtml(state.query)}".`);
  }
  if (state.subjectId) {
    parts.push(
      `Subject focus: ${escapeHtml(getSubjectLabel(state.subjectId))}.`
    );
  }
  if (journalMatches.length) {
    parts.push(
      `${journalMatches.length} ${resultLabel} match${
        journalMatches.length !== 1 ? "es" : ""
      } found.`
    );
  } else {
    parts.push("No matching publications found in this tool.");
  }
  elements.resultsSummary.innerHTML = parts
    .map((p) => `<p>${p}</p>`)
    .join("");

  let totalCards = 0;

  if (journalMatches.length) {
    totalCards += journalMatches.length;
    elements.resultsList.appendChild(
      renderSectionHeader("Matching publications")
    );
    journalMatches.forEach((journal) => {
      const card = renderJournalCard(journal);
      elements.resultsList.appendChild(card);
      hydrateJournalCard(card, journal);
    });
    elements.resultsList.style.display = "block";
    elements.resultsPlaceholder.style.display = "none";
  } else {
    elements.resultsList.style.display = "none";
    elements.resultsPlaceholder.style.display = "block";
    elements.resultsPlaceholder.innerHTML = renderEmptyState(state, []);
  }

  elements.resultsCountBadge.textContent = `${totalCards} result${
    totalCards !== 1 ? "s" : ""
  }`;

/*
  // Only render publication matches if no supportType is active
  if (!state.supportType && journalMatches.length) {
    totalCards += journalMatches.length;
    elements.resultsList.appendChild(renderSectionHeader("Matching publications"));
    journalMatches.forEach((journal) => {
      const card = renderJournalCard(journal);
      elements.resultsList.appendChild(card);
      hydrateJournalCard(card, journal);
    });
  } */

  if (dealMatches.length) {
    totalCards += dealMatches.length;
    elements.resultsList.appendChild(
      renderSectionHeader("Relevant publisher deals")
    );
    dealMatches.forEach((deal) => {
      elements.resultsList.appendChild(renderDealCard(deal));
    });
  }

  if (recommendations.length) {
    totalCards += recommendations.length;
    elements.resultsList.appendChild(
      renderSectionHeader("Covered alternatives")
    );
    recommendations.forEach((journal) => {
      const card = renderJournalCard(journal, true);
      elements.resultsList.appendChild(card);
      hydrateJournalCard(card, journal);
    });
  }

  if (!totalCards) {
    elements.resultsList.style.display = "none";
    elements.resultsPlaceholder.style.display = "block";
    elements.resultsPlaceholder.innerHTML = renderEmptyState(
      state,
      uncoveredPublishers
    );
  } else {
    elements.resultsList.style.display = "block";
  }

  // Badge + mode for normal search
  setResultsMode(elements, {
    title: "Search Results",
    modeLabel: state.subjectId ? "Search with filters" : "Search",
    badgeText: `${totalCards} result${totalCards !== 1 ? "s" : ""}`,
    modeClass: "mode-search",
  });

  // NEW: feedback prompt for search mode
  renderFeedbackPrompt(elements, {
    mode: "search",
    hasResults: totalCards > 0,
    state,
  });
}

function runSubjectBrowse(state, elements) {
  const subjectId = state.subjectId;
  currentBrowseSubject = subjectId;

  // Build full list of journals for this subject
  const matches = journalBrowseRecords
    .filter((journal) => journal.subjectIds.includes(subjectId))
    .sort((a, b) => a.journal_name.localeCompare(b.journal_name));

  currentBrowseList = matches;
  currentBrowseRendered = 0;

  const label = getSubjectLabel(subjectId);
  const count = matches.length;

  const parts = [];
  parts.push(`Subject focus: ${escapeHtml(label)}.`);
  parts.push(
    `${count} journal${count !== 1 ? "s" : ""} tagged in this subject.`
  );

  // Add context line for the first page (1–BROWSE_PAGE_SIZE or fewer)
  if (count > 0) {
    const end = Math.min(BROWSE_PAGE_SIZE, count);
    parts.push(
      `Showing 1–${end} of ${count} journal${count !== 1 ? "s" : ""}.`
    );
  }

  elements.resultsSummary.innerHTML = parts
    .map((p) => `<p>${p}</p>`)
    .join("");
  elements.resultsList.innerHTML = "";

  // Render first page with hint
  renderBrowsePage(elements, { withHint: true });

  // Set mode/title/badge for Subject Browse
  setResultsMode(elements, {
    title: "Subject Browse",
    modeLabel: "Subject browse",
    badgeText: `${count} journal${count !== 1 ? "s" : ""}`,
    modeClass: "mode-browse",
  });

  // Feedback prompt for browse mode
  renderFeedbackPrompt(elements, {
    mode: "browse",
    hasResults: currentBrowseList.length > 0,
    state,
  });
}

function showJournalDetails(journal, elements) {
  if (
    !elements.resultsArea ||
    !elements.resultsList ||
    !elements.resultsPlaceholder ||
    !elements.resultsCountBadge ||
    !elements.resultsSummary
  )
    return;

  elements.resultsArea.style.display = "block";
  elements.resultsArea.scrollTop = 0;
  window.scrollTo({
    top: elements.resultsArea.offsetTop - 80,
    behavior: "smooth",
  });

  elements.resultsList.innerHTML = "";
  elements.resultsList.style.display = "block";
  elements.resultsPlaceholder.style.display = "none";
  elements.resultsSummary.innerHTML = "";

  // clear any existing feedback prompt for A–Z detail views
  if (elements.feedbackPromptContainer) {
    elements.feedbackPromptContainer.innerHTML = "";
  }

  setResultsMode(elements, {
  title: "Journal Details",
  modeLabel: "Journals A–Z",
  badgeText: "1 result",
  modeClass: "mode-browse",
});

  // Summary line
  elements.resultsSummary.innerHTML = `
    <p>Showing details for <strong>${escapeHtml(journal.journal_name)}</strong>.</p>
    <p>Publisher: ${escapeHtml(journal.publisher)}.</p>
  `;

  // Render the journal card directly from the selected record
  const card = renderJournalCard(journal);
  elements.resultsList.appendChild(renderSectionHeader("Journal details"));
  elements.resultsList.appendChild(card);
  hydrateJournalCard(card, journal);

}

function renderBrowsePage(elements, options = {}) {
  if (!currentBrowseList.length) return;

  const container = elements.resultsList;
  const start = currentBrowseRendered;
  const end = Math.min(
    currentBrowseRendered + BROWSE_PAGE_SIZE,
    currentBrowseList.length
  );
  const slice = currentBrowseList.slice(start, end);

  if (start === 0) {
    // Section header
    container.appendChild(renderSectionHeader("Journals in this subject"));

    // Optional inline hint (once, on first render)
    if (options.withHint) {
      const hint = document.createElement("p");
      hint.className = "text-muted subject-browse-hint";
      hint.textContent =
        "Scroll to the bottom to load more journals in this subject.";
      container.appendChild(hint);
    }
  }

  slice.forEach((journal) => {
    const card = renderJournalCard(journal);
    container.appendChild(card);
    hydrateJournalCard(card, journal);
  });

  currentBrowseRendered = end;

  // Remove old "Load more" button if any
  const existing = document.getElementById("loadMoreBrowseBtn");
  if (existing) existing.remove();

  if (currentBrowseRendered < currentBrowseList.length) {
    const loadMoreBtn = document.createElement("button");
    loadMoreBtn.id = "loadMoreBrowseBtn";
    loadMoreBtn.type = "button";
    loadMoreBtn.className = "search-btn clear-btn";
    loadMoreBtn.style.marginTop = "12px";

    // Compute next slice range and label
    const nextStart = currentBrowseRendered + 1;
    const nextEnd = Math.min(
      currentBrowseRendered + BROWSE_PAGE_SIZE,
      currentBrowseList.length
    );
    const remaining = currentBrowseList.length - currentBrowseRendered;

    if (remaining > BROWSE_PAGE_SIZE) {
      loadMoreBtn.textContent = `Load more (${nextStart}–${nextEnd})`;
    } else {
      loadMoreBtn.textContent = "Show remaining journals";
    }

    loadMoreBtn.addEventListener("click", () => {
      renderBrowsePage(elements);
    });
    container.appendChild(loadMoreBtn);
  }
}

function analyzeQuery(query) {
  const normalized = normalizeForSearch(query);
  const subjects = inferSubjectsFromText(query, false);
  const publishers = matchPublisherEntries(query);
  return {
    normalized,
    subjects,
    publishers,
    phraseRegex: buildNormalizedPhraseRegex(query),
    termRegexes: buildTermRegexes(query),
    identifiers: extractQueryIdentifiers(query),
  };
}

function matchSupportTopics(state, analysis) {
  return SUPPORT_TOPICS.map((topic) => {
    if (state.supportType && topic.supportType !== state.supportType) {
      return null;
    }
    if (state.benefitType && topic.benefitType !== state.benefitType) {
      return null;
    }

    const topicText = normalizeForSearch(
      [topic.title, topic.prompt, topic.keywords.join(" ")].join(" "),
    );

    let matchType = "";
    if (!analysis.normalized) {
      if (state.supportType === topic.supportType) {
        matchType = "support-type";
      } else if (state.benefitType && topic.benefitType === state.benefitType) {
        matchType = "benefit-type";
      }
    } else if (
      matchesNormalizedPhrase(topicText, analysis.phraseRegex)
    ) {
      matchType = "phrase";
    } else if (
      topic.keywords.some((keyword) =>
        matchesNormalizedText(analysis.normalized, keyword),
      )
    ) {
      matchType = "keyword";
    } else if (matchesAllTerms(topicText, analysis.termRegexes)) {
      matchType = "all-terms";
    } else if (state.supportType === topic.supportType) {
      matchType = "support-type";
    }

    return matchType ? { ...topic, matchType } : null;
  })
    .filter(Boolean)
    .sort(
      (left, right) =>
        getSupportMatchPriority(left.matchType) -
          getSupportMatchPriority(right.matchType) ||
        left.title.localeCompare(right.title),
    )
    .slice(0, 3);
}

function findJournalMatches(state, analysis) {
  const normalizedPublisher = state.publisherName
    ? normalizeForSearch(state.publisherName)
    : "";

  return searchableRecords
    .map((journal) => {
      if (
        normalizedPublisher &&
        normalizeForSearch(journal.publisher) !== normalizedPublisher
      ) {
        return null;
      }

      if (state.subjectId && !journal.subjectIds.includes(state.subjectId)) {
        return null;
      }
      if (state.benefitType && journal.benefitType !== state.benefitType) {
        return null;
      }
      if (state.supportType && !journalSupportsNeed(journal, state.supportType)) {
        return null;
      }

      const matchType = classifyJournalMatch(journal, state, analysis);
      return matchType ? { ...journal, matchType } : null;
    })
    .filter(Boolean)
    .sort(
      (left, right) =>
        getDirectMatchPriority(left.matchType) -
          getDirectMatchPriority(right.matchType) ||
        left.journal_name.localeCompare(right.journal_name),
    )
    .slice(0, 10);
}

function findDealMatches(state, analysis, journalMatches, supportMatches) {
  const matchedDealIds = new Set(
    journalMatches.map(journal => journal.deal_id).filter(Boolean)
  );
  const topicDealIds = new Set(
    supportMatches.flatMap(topic => topic.dealIds || [])
  );

   if (!state.publisherName && !topicDealIds.size && !matchedDealIds.size) {
    return [];
  }

  return journalDeals
    .map((deal) => {
      if (state.benefitType && deal.benefitType !== state.benefitType) {
        return null;
      }
      if (state.supportType && !dealSupportsNeed(deal, state.supportType)) {
        return null;
      }

      const matchType = classifyDealMatch(
        deal,
        state,
        analysis,
        matchedDealIds,
        topicDealIds,
      );
      return matchType ? { ...deal, matchType } : null;
    })
    .filter(Boolean)
    .sort(
      (left, right) =>
        getDirectMatchPriority(left.matchType) -
          getDirectMatchPriority(right.matchType) ||
        left.publisher.localeCompare(right.publisher),
    )
    .slice(0, 6);
}

function buildRecommendations(state, analysis, journalMatches) {
  const matchedIds = new Set(journalMatches.map((journal) => journal.id));
  const desiredSubjects = uniqueValues(
    [state.subjectId, ...analysis.subjects].filter(Boolean),
  );
  const desiredPublishers = uniqueValues(
    [
      state.publisherName ? normalizeForSearch(state.publisherName) : "",
      ...analysis.publishers.map((publisher) => normalizeForSearch(publisher.name)),
    ].filter(Boolean),
  );

  if (
    !desiredSubjects.length &&
    !desiredPublishers.length
  )
    return [];

  return journalBrowseRecords
    .filter((journal) => !matchedIds.has(journal.id))
    .filter((journal) => {
      if (state.benefitType && journal.benefitType !== state.benefitType) {
        return false;
      }
      if (state.supportType && !journalSupportsNeed(journal, state.supportType)) {
        return false;
      }

      const subjectMatch =
        !desiredSubjects.length ||
        desiredSubjects.some((subjectId) => journal.subjectIds.includes(subjectId));
      const publisherMatch =
        !desiredPublishers.length ||
        desiredPublishers.includes(journal.publisherNormalized);

      return subjectMatch && publisherMatch;
    })
    .sort((left, right) => left.journal_name.localeCompare(right.journal_name))
    .slice(0, 6);
}

function renderSummary(
  container,
  state,
  journalMatches,
  dealMatches,
  recommendations,
  uncoveredPublishers,
) {
  const parts = [];
  const resultLabel = journalMatches.some(
    (journal) => journal.recordType !== "journal",
  )
    ? "publication"
    : "journal";
  if (state.query) {
    parts.push(`Searching for "${escapeHtml(state.query)}".`);
  }
  if (state.subjectId) {
    parts.push(
      `Subject focus: ${escapeHtml(getSubjectLabel(state.subjectId))}.`,
    );
  }
  if (state.supportType) {
    parts.push(
      `Support need: ${escapeHtml(getSupportLabel(state.supportType))}.`,
    );
  }
  if (journalMatches.length) {
    parts.push(
      `${journalMatches.length} ${resultLabel} match${journalMatches.length !== 1 ? "es" : ""} found.`,
    );
  } else if (dealMatches.length) {
    parts.push(
      "No exact publication match was found, but related publisher agreements are available.",
    );
  }
  if (recommendations.length) {
    parts.push(
      `${recommendations.length} covered alternative${recommendations.length !== 1 ? "s" : ""} suggested.`,
    );
  }
  if (uncoveredPublishers.length) {
  const names = uncoveredPublishers
    .map((publisher) => publisher.name)
    .join(", ");

  parts.push(`
    <div class="coverage-advisor">
      <h4>Coverage Advisor</h4>
      <p><strong>${escapeHtml(names)}</strong> does not appear in our current open access agreement list for this search.</p>
      <ul>
        <li>Pause before paying any APC or invoice.</li>
        <li>Use the subject filter to look for covered alternatives in the same discipline.</li>
        <li>Contact the NYU Health Sciences Library for publisher-specific guidance.</li>
      </ul>
    </div>
  `);
}
  container.innerHTML = parts.map((part) => `<p>${part}</p>`).join("");
}

function renderSectionHeader(title) {
  const wrapper = document.createElement("div");
  wrapper.className = "results-section-header";
  wrapper.innerHTML = `<h3>${escapeHtml(title)}</h3>`;
  return wrapper;
}

function renderSupportCard(topic) {
  const card = document.createElement("div");
  card.className = "result-card support-card";

  // NEW: build links HTML if present
  const linksHtml = (topic.links || [])
    .map(link =>
      `<a href="${escapeAttribute(link.url)}" target="_blank" rel="noopener">${escapeHtml(link.label)}</a>`
    )
    .join(" | ");

  card.innerHTML = `
    <div class="card">
      <div class="card-body">
        <div class="card-badge-row">
          <span class="result-badge result-badge-info">
            ${escapeHtml(getSupportLabel(topic.supportType))}
          </span>
          ${
            topic.benefitType
              ? `<span class="result-badge result-badge-neutral">
                   ${escapeHtml(DEAL_BADGE_LABELS[topic.benefitType] || "Special handling")}
                 </span>`
              : ""
          }
        </div>
        <h4 class="card-title">${escapeHtml(topic.title)}</h4>
        <p class="card-copy">${escapeHtml(topic.prompt)}</p>
        <ul class="action-list">
          ${(topic.actions || [])
            .map(action => `<li>${escapeHtml(action)}</li>`)
            .join("")}
        </ul>
        ${
          linksHtml
            ? `<div class="action-links">${linksHtml}</div>`
            : ""
        }
      </div>
    </div>
  `;
  return card;
}

function renderJournalCard(journal, isRecommendation = false) {
  const card = document.createElement("div");
  card.className = `result-card journal-card${isRecommendation ? " recommendation-card" : ""}`;
  const deal = journal.deal;

  const subjectTags = journal.subjectLabels
    .map(label => `<span class="tag">${escapeHtml(label)}</span>`)
    .join("");

  const links = deal?.links?.length
    ? `<div class="action-links">${deal.links
        .map(link => `<a href="${escapeAttribute(link.url)}" target="_blank" rel="noopener">${escapeHtml(link.label)}</a>`)
        .join("")}</div>`
    : "";

  const typeLabel = getRecordTypeLabel(journal.recordType);
  const subjectRow =
    subjectTags ||
    `<span class="tag">${escapeHtml(getDefaultRecordTag(journal.recordType))}</span>`;

  // NEW: build catalog URL if ISBN is present
  const isbnValue = (journal.isbn || "").trim();
  const catalogUrl = isbnValue
    ? `https://search.hsl.med.nyu.edu/discovery/search?query=any,contains,${encodeURIComponent(
        isbnValue
      )}&tab=Main_Slot&search_scope=LC_HSL_AND_NYU&vid=01NYU_HS:HSL&lang=en&offset=0`
    : "";
  const printIssnValue = (journal.issn_print || "").trim();
  const onlineIssnValue = (journal.issn_online || "").trim();
  const printIssnUrl = printIssnValue
    ? `https://search.hsl.med.nyu.edu/discovery/search?query=any,contains,${encodeURIComponent(
        printIssnValue
      )}&tab=Main_Slot&search_scope=LC_HSL_AND_NYU&vid=01NYU_HS:HSL&lang=en&offset=0`
    : "";
  const onlineIssnUrl = onlineIssnValue
    ? `https://search.hsl.med.nyu.edu/discovery/search?query=any,contains,${encodeURIComponent(
        onlineIssnValue
      )}&tab=Main_Slot&search_scope=LC_HSL_AND_NYU&vid=01NYU_HS:HSL&lang=en&offset=0`
    : "";

  // Build identifier fields (ISSN vs ISBN)
  const idRows =
  journal.recordType === "monograph"
    ? `
      <div>
        <strong>ISBN</strong>
        ${
          isbnValue && catalogUrl
            ? `<a href="${escapeAttribute(catalogUrl)}" target="_blank" rel="noopener">
                 ${escapeHtml(isbnValue)}
               </a>`
            : `<span>${escapeHtml(isbnValue || "Not listed")}</span>`
        }
      </div>
      <div>
        <strong>Publication date</strong>
        <span>${escapeHtml(journal.publicationDate || "Not listed")}</span>
      </div>
    `
    : journal.recordType === "journal" || journal.recordType === "magazine"
    ? `
      ${
        printIssnValue
          ? `
        <div>
          <strong>ISSN</strong>
          ${
            printIssnUrl
              ? `<a href="${escapeAttribute(printIssnUrl)}" target="_blank" rel="noopener">
                   ${escapeHtml(printIssnValue)}
                 </a>`
              : `<span>${escapeHtml(printIssnValue)}</span>`
          }
        </div>
        `
          : ""
      }
      ${
        onlineIssnValue
          ? `
        <div>
          <strong>eISSN</strong>
          ${
            onlineIssnUrl
              ? `<a href="${escapeAttribute(onlineIssnUrl)}" target="_blank" rel="noopener">
                   ${escapeHtml(onlineIssnValue)}
                 </a>`
              : `<span>${escapeHtml(onlineIssnValue)}</span>`
          }
        </div>
        `
          : ""
      }
      ${
        !printIssnValue && !onlineIssnValue
          ? `
        <div>
          <strong>Identifiers</strong>
          <span>Not listed</span>
        </div>
        `
          : ""
      }
    `
    : `
      <div>
        <strong>Publication date</strong>
        <span>${escapeHtml(journal.publicationDate || "Not listed")}</span>
      </div>
      <div>
        <strong>Identifiers</strong>
        <span>${escapeHtml(getRecordIdentifierSummary(journal) || "Not listed")}</span>
      </div>
    `;

  card.innerHTML = `
    <div class="card">
      <div class="card-body">
        <div class="journal-top">
          <img class="journal-cover" src="${placeholderThumbnail}" alt="${escapeAttribute(journal.journal_name)} cover" />
          <div class="journal-copy">
            <div class="card-badge-row">
  <span class="result-badge result-badge-primary">${escapeHtml(journal.benefitLabel)}</span>
  <span class="result-badge result-badge-neutral">${escapeHtml(typeLabel)}</span>
  ${
    deal
      ? ""
      : `<span class="result-badge result-badge-warning">
           Not covered by current OA agreements
         </span>`
  }
  ${deal?.status ? `<span class="result-badge result-badge-${escapeAttribute(deal.status.tone)}">${escapeHtml(deal.status.label)}</span>` : ""}
  ${isRecommendation ? `<span class="result-badge result-badge-neutral">Alternative</span>` : ""}
</div>
            <h4 class="card-title">${escapeHtml(journal.journal_name)}</h4>
            <p class="journal-meta">${escapeHtml(journal.publisher)}</p>
            <div class="tag-row">${subjectRow}</div>
          </div>
        </div>
        <div class="detail-grid">
          <div>
            <strong>Coverage</strong>
            <span>${escapeHtml(journal.coverage || "See deal details")}</span>
          </div>
          <div>
            <strong>Cost to author</strong>
            <span>${escapeHtml(journal.cost_to_author || "Varies")}</span>
          </div>
          ${idRows}
        </div>
        ${deal ? renderDealSnapshot(deal) : ""}
        <div class="next-step-panel">
          <strong>What to do next</strong>
          <ul class="action-list">
            ${journal.nextSteps.map(step => `<li>${escapeHtml(step)}</li>`).join("")}
          </ul>
        </div>
        ${
          journal.hasLiveNlmLookup
            ? `
        <div class="nlm-panel" data-nlm-panel="true">
          <div class="nlm-header">
            <strong>PubMed and NLM indexing</strong>
            <span class="nlm-status">Checking NLM Catalog...</span>
          </div>
          <div class="tag-row nlm-tags">
            <span class="tag tag-muted">Preparing lookup</span>
          </div>
          <div class="action-links">
            <a href="${escapeAttribute(journal.nlmCatalogUrl)}" target="_blank" rel="noopener">Open NLM Catalog</a>
          </div>
        </div>
        `
            : ""
        }
        ${links}
      </div>
    </div>
  `;

  return card;
}

function renderDealSnapshot(deal) {
  return `
    <div class="deal-snapshot">
      <div class="detail-grid">
        <div>
          <strong>Publisher deal</strong>
          <span>${escapeHtml(deal.publisher)}</span>
        </div>
        <div>
          <strong>Eligible authors</strong>
          <span>${escapeHtml(deal.eligible_authors || "See agreement details")}</span>
        </div>
        <div>
          <strong>Journal scope</strong>
          <span>${escapeHtml(deal.journal_scope || "See publisher guidance")}</span>
        </div>
        <div>
          <strong>Model</strong>
          <span>${escapeHtml(deal.model || deal.type || "Agreement")}</span>
        </div>
      </div>
      ${deal.fellowship_code ? `<p class="callout-line"><strong>Fellowship code:</strong> ${escapeHtml(deal.fellowship_code)}</p>` : ""}
      ${deal.restrictions.length ? `<p class="callout-line"><strong>Restrictions:</strong> ${escapeHtml(deal.restrictions.join("; "))}</p>` : ""}
    </div>
  `;
}

function renderDealCard(deal) {
  const card = document.createElement("div");
  card.className = "result-card deal-card";
  const links = deal.links.length
    ? `<div class="action-links">${deal.links.map((link) => `<a href="${escapeAttribute(link.url)}" target="_blank" rel="noopener">${escapeHtml(link.label)}</a>`).join("")}</div>`
    : "";
  card.innerHTML = `
    <div class="card">
      <div class="card-body">
        <div class="card-badge-row">
          <span class="result-badge result-badge-primary">${escapeHtml(DEAL_BADGE_LABELS[deal.benefitType] || "Agreement")}</span>
          <span class="result-badge result-badge-${escapeAttribute(deal.status.tone)}">${escapeHtml(deal.status.label)}</span>
        </div>
        <h4 class="card-title">${escapeHtml(deal.publisher)}</h4>
        <p class="card-copy">${escapeHtml(deal.details || deal.journal_scope || "Publisher agreement details available.")}</p>
        <div class="detail-grid">
          <div>
            <strong>Coverage</strong>
            <span>${escapeHtml(deal.coverage || "Varies")}</span>
          </div>
          <div>
            <strong>Cost to author</strong>
            <span>${escapeHtml(deal.cost_to_author || "Varies")}</span>
          </div>
          <div>
            <strong>Eligible authors</strong>
            <span>${escapeHtml(deal.eligible_authors || "See publisher guidance")}</span>
          </div>
          <div>
            <strong>Journal scope</strong>
            <span>${escapeHtml(deal.journal_scope || "See publisher guidance")}</span>
          </div>
        </div>
        ${deal.fellowship_code ? `<p class="callout-line"><strong>Fellowship code:</strong> ${escapeHtml(deal.fellowship_code)}</p>` : ""}
        ${deal.special_instructions.length ? `<p class="callout-line"><strong>Special instructions:</strong> ${escapeHtml(deal.special_instructions.join("; "))}</p>` : ""}
        ${deal.restrictions.length ? `<p class="callout-line"><strong>Restrictions:</strong> ${escapeHtml(deal.restrictions.join("; "))}</p>` : ""}
        <ul class="action-list">
          ${deal.nextSteps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}
        </ul>
        ${links}
      </div>
    </div>
  `;
  return card;
}

function showSingleDeal(deal, elements) {
  if (
    !elements.resultsArea ||
    !elements.resultsList ||
    !elements.resultsPlaceholder ||
    !elements.resultsCountBadge ||
    !elements.resultsSummary
  ) return;

  elements.resultsArea.style.display = "block";
  elements.resultsArea.scrollTop = 0;
  window.scrollTo({
    top: elements.resultsArea.offsetTop - 80,
    behavior: "smooth"
  });

  elements.resultsList.innerHTML = "";
  elements.resultsList.style.display = "block";
  elements.resultsPlaceholder.style.display = "none";
  
  setResultsMode(elements, {
  title: "Agreement Details",
  modeLabel: "Deal summary",
  badgeText: "1 deal",
  modeClass: "mode-browse",
});

elements.resultsSummary.innerHTML = "";

  // Summary for this specific deal
  elements.resultsSummary.innerHTML = `
    <p>Showing agreement details for <strong>${escapeHtml(deal.publisher)}</strong>.</p>
    <p>Deal: <strong>${escapeHtml(deal.deal_id || "Publisher agreement")}</strong></p>
  `;

  // Render only this deal’s card
  elements.resultsList.appendChild(renderSectionHeader("Publisher agreement details"));
  elements.resultsList.appendChild(renderDealCard(deal));

}


function showPublisherDeals(publisherName, elements) {
  if (
    !elements.resultsArea ||
    !elements.resultsList ||
    !elements.resultsPlaceholder ||
    !elements.resultsCountBadge ||
    !elements.resultsSummary
  )
    return;

  // Normalize publisher name
  const normalized = normalizeForSearch(publisherName);

  // Find all deals whose publisher matches this name
  const deals = journalDeals.filter(
    (deal) => normalizeForSearch(deal.publisher) === normalized,
  );

  elements.resultsArea.style.display = "block";
  elements.resultsArea.scrollTop = 0;
  window.scrollTo({
    top: elements.resultsArea.offsetTop - 80,
    behavior: "smooth",
  });

  elements.resultsList.innerHTML = "";
  elements.resultsList.style.display = "block";
  elements.resultsPlaceholder.style.display = "none";
  elements.resultsSummary.innerHTML = "";

  setResultsMode(elements, {
  title: "Publisher Agreements",
  modeLabel: "Publisher browser",
  badgeText: `${deals.length} deal${deals.length !== 1 ? "s" : ""}`,
  modeClass: "mode-browse",
});

  // Build a simple summary
  if (deals.length) {
    elements.resultsSummary.innerHTML = `
      <p>Showing publisher agreement information for <strong>${escapeHtml(publisherName)}</strong>.</p>
      <p>${deals.length} deal${deals.length !== 1 ? "s are" : " is"} listed.</p>
    `;
  } else {
    elements.resultsSummary.innerHTML = `
      <p>No publisher agreement record was found for <strong>${escapeHtml(publisherName)}</strong> in this dataset.</p>
    `;
  }

  // Feedback prompt for publisher browse
  renderFeedbackPrompt(elements, {
    mode: "browse",
    hasResults: deals.length > 0,
    state: {
      // lightweight state snapshot for this mode
      query: "",
      subjectId: "",
      supportType: "",
      benefitType: "",
      publisherName,
    },
  });

  // Render only publisher deal cards
  if (deals.length) {
    elements.resultsList.appendChild(
      renderSectionHeader("Publisher agreement details"),
    );
    deals.forEach((deal) => {
      elements.resultsList.appendChild(renderDealCard(deal));
    });
  }

}

function hydrateJournalCard(card, journal) {
  const cover = card.querySelector(".journal-cover");
  const issn = journal.issn_print || journal.issn_online;
  fetchJournalCover(issn, journal.journal_name).then((result) => {
    if (!cover || !cover.isConnected) return;
    cover.src = result.thumbnail;
    cover.alt = `${journal.journal_name} cover`;
  });

  const nlmPanel = card.querySelector("[data-nlm-panel]");
  if (!nlmPanel) return;
  if (!journal.hasLiveNlmLookup) {
    updateNlmPanel(nlmPanel, {
      status: "No ISSN available for live lookup",
      source: "Local data",
      badges: [{ label: "Indexing unavailable", tone: "neutral" }],
      subjects: journal.subjectLabels,
    });
    return;
  }
/*   
  getNlmMetadata(journal)
    .then((metadata) => {
      if (!nlmPanel.isConnected) return;
      updateNlmPanel(nlmPanel, metadata, journal.subjectLabels);
    })
    .catch(() => {
      if (!nlmPanel.isConnected) return;
      updateNlmPanel(nlmPanel, {
        status: "Live NLM lookup unavailable",
        source: "Fallback",
        badges: [{ label: "Use NLM link to verify", tone: "warning" }],
        subjects: journal.subjectLabels,
      });

    });*/
}

function fetchJournalCover(issn, originalTitle) {
  if (!issn || !isValidISSN(issn)) {
    return Promise.resolve({
      thumbnail: placeholderThumbnail,
      journalTitle: originalTitle,
    });
  }

  const apiUrl = `https://browzine-coverart-api.vercel.app/api/getLibrary?issn=${encodeURIComponent(issn.trim())}`;
  return fetch(apiUrl)
    .then((response) => {
      if (!response.ok) throw new Error(`API error ${response.status}`);
      return response.json();
    })
    .then((data) => {
      const journal = data?.data?.[0];
      return {
        thumbnail: journal?.coverImageUrl || placeholderThumbnail,
        journalTitle: journal?.title || originalTitle,
      };
    })
    .catch(() => ({
      thumbnail: placeholderThumbnail,
      journalTitle: originalTitle,
    }));
}
/*
function getNlmMetadata(journal) {
  const cacheKey =
    journal.issn_print || journal.issn_online || journal.journal_name;
  if (!nlmLookupCache.has(cacheKey)) {
    nlmLookupCache.set(cacheKey, fetchNlmMetadata(journal));
  }
  return nlmLookupCache.get(cacheKey);
}*/

async function fetchNlmMetadata(journal) {
  const queryTerm =
    journal.issn_print || journal.issn_online
      ? `${journal.issn_print || journal.issn_online}[issn] AND ncbijournals`
      : `${journal.journal_name}[Title] AND ncbijournals`;

  const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=nlmcatalog&retmode=json&term=${encodeURIComponent(queryTerm)}`;

  return fetch(searchUrl)
    .then((response) => {
      if (!response.ok) throw new Error("NLM search unavailable");
      return response.json();
    })
    .then((searchResult) => {
      const id = searchResult?.esearchresult?.idlist?.[0];
      if (!id) {
        return {
          status: "No live NLM match found",
          source: "NLM Catalog",
          badges: [{ label: "Check manually", tone: "warning" }],
          subjects: journal.subjectLabels,
        };
      }
      const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=nlmcatalog&retmode=json&id=${encodeURIComponent(id)}`;
      return fetch(summaryUrl);
    })
    .then((response) => {
      if (!response) return null;
      if (typeof response.json !== "function") return response;
      if (!response.ok) throw new Error("NLM summary unavailable");
      return response.json();
    })
    .then((summaryJson) => {
      if (!summaryJson || !summaryJson.result) return summaryJson;
      const result = summaryJson.result;
      const uid = result.uids?.[0];
      const record = uid ? result[uid] : null;
      return parseNlmRecord(record, journal.subjectLabels);
    })
    .catch(() => ({
      status: "Live NLM lookup unavailable",
      source: "Fallback",
      badges: [{ label: "Open NLM Catalog link", tone: "warning" }],
      subjects: journal.subjectLabels,
    }));
}

function parseNlmRecord(record, fallbackSubjects) {
  if (!record || typeof record !== "object") {
    return {
      status: "Live NLM lookup unavailable",
      source: "Fallback",
      badges: [{ label: "Open NLM Catalog link", tone: "warning" }],
      subjects: fallbackSubjects,
    };
  }

  const values = [];
  collectRecordStrings(record, "", values);
  const serialized = values.map((item) => item.value.toLowerCase()).join(" | ");
  const subjectCandidates = uniqueValues(
    values
      .filter(
        (item) => item.key.includes("subject") || item.key.includes("mesh"),
      )
      .map((item) => item.value)
      .filter((value) => value.length > 2 && value.length < 80),
  ).slice(0, 6);

  const badges = [];
  const currentlyIndexed = serialized.includes("currently indexed for medline");
  const notCurrentlyIndexed = serialized.includes(
    "not currently indexed for medline",
  );
  const mentionsPubmed = serialized.includes("pubmed");
  const mentionsPmc =
    serialized.includes("pubmed central") ||
    serialized.includes("(pmc)") ||
    serialized.includes("journalspmc");

  if (currentlyIndexed)
    badges.push({ label: "Currently indexed in MEDLINE", tone: "active" });
  else if (notCurrentlyIndexed)
    badges.push({ label: "Not currently indexed in MEDLINE", tone: "warning" });

  if (mentionsPubmed)
    badges.push({ label: "Referenced in PubMed or NCBI", tone: "info" });
  if (mentionsPmc)
    badges.push({ label: "PubMed Central signal detected", tone: "info" });
  if (!badges.length)
    badges.push({ label: "Indexing details unclear", tone: "neutral" });

  return {
    status: "Live NLM lookup loaded",
    source: "NLM Catalog API",
    badges,
    subjects: subjectCandidates.length ? subjectCandidates : fallbackSubjects,
  };
}

function collectRecordStrings(node, keyPath, output) {
  if (!node) return;
  if (typeof node === "string") {
    output.push({ key: keyPath.toLowerCase(), value: cleanText(node) });
    return;
  }
  if (Array.isArray(node)) {
    node.forEach((item, index) =>
      collectRecordStrings(item, `${keyPath}[${index}]`, output),
    );
    return;
  }
  if (typeof node === "object") {
    Object.entries(node).forEach(([key, value]) => {
      collectRecordStrings(value, keyPath ? `${keyPath}.${key}` : key, output);
    });
  }
}

function updateNlmPanel(panel, metadata, fallbackSubjects = []) {
  const status = panel.querySelector(".nlm-status");
  const tagRow = panel.querySelector(".nlm-tags");
  if (status) {
    status.textContent = metadata.status || "NLM lookup ready";
  }
  if (tagRow) {
    const subjectTags = (
      metadata.subjects && metadata.subjects.length
        ? metadata.subjects
        : fallbackSubjects
    )
      .slice(0, 6)
      .map((subject) => `<span class="tag">${escapeHtml(subject)}</span>`)
      .join("");
    const badges = (metadata.badges || [])
      .map(
        (badge) =>
          `<span class="tag tag-${escapeAttribute(badge.tone)}">${escapeHtml(badge.label)}</span>`,
      )
      .join("");
    tagRow.innerHTML = `${badges}${subjectTags || '<span class="tag tag-muted">No subject terms returned</span>'}`;
  }
}

function renderEmptyState(state, uncoveredPublishers) {
  const lines = [
  '<p class="text-muted mb-0"><strong>No exact publication match found in our current agreements.</strong></p>',
  '<p class="text-muted mb-0">Before you give up—or pay an APC—try one of these:</p>',
  '<ul class="text-muted mb-0 coverage-suggestions">',
  '<li>Use the Subject filter to browse covered journals in the same area.</li>',
  '<li>Try searching by publisher name instead of the journal title.</li>',
  '<li>Contact the NYU Health Sciences Library with your journal and publisher for targeted advice.</li>',
  '</ul>'
];
  if (state.query) {
    lines.push(
      `<p class="text-muted mb-0">Search terms used: <strong>${escapeHtml(state.query)}</strong></p>`,
    );
  }
  if (uncoveredPublishers.length) {
    lines.push(
      `<p class="text-muted mb-0">No current agreement record for ${escapeHtml(uncoveredPublishers.map((item) => item.name).join(", "))} was found in this local dataset.</p>`,
    );
  }
  lines.push(
    '<p class="text-muted mb-0">If the publication is not listed, contact the library before paying an APC invoice.</p>',
  );
  return lines.join("");
}

function renderFeedbackPrompt(elements, options) {
  if (!elements.feedbackPromptContainer) return;

  const { mode, hasResults, state } = options || {};

  // Clear any existing prompt
  elements.feedbackPromptContainer.innerHTML = "";

  // Only show when there's something meaningful to react to
  if (!hasResults && mode !== "coverage" && mode !== "browse") {
  return;
}

  const wrapper = document.createElement("div");
  wrapper.className = "feedback-prompt";

  const label = document.createElement("span");
  label.className = "feedback-prompt-label";
  label.textContent = "Was this information helpful?";
  wrapper.appendChild(label);

  const yesBtn = document.createElement("button");
  yesBtn.type = "button";
  yesBtn.className = "feedback-button";
  yesBtn.textContent = "👍";

  const noBtn = document.createElement("button");
  noBtn.type = "button";
  noBtn.className = "feedback-button";
  noBtn.textContent = "👎";

  wrapper.appendChild(yesBtn);
  wrapper.appendChild(noBtn);

  elements.feedbackPromptContainer.appendChild(wrapper);

  function finishFeedback(message) {
    wrapper.innerHTML = "";
    const thanks = document.createElement("span");
    thanks.className = "feedback-thanks";
    thanks.innerHTML = escapeHtml(
      message || "Thanks — your feedback helps improve this tool."
    );
    wrapper.appendChild(thanks);
  }

  yesBtn.addEventListener("click", () => {
    sendFeedbackEvent({
      mode,
      helpful: true,
      stateSnapshot: buildFeedbackStateSnapshot(state),
      eventType: "feedback",
    });
    finishFeedback("Thanks so much for letting us know.");
  });

  noBtn.addEventListener("click", () => {
    sendFeedbackEvent({
      mode,
      helpful: false,
      stateSnapshot: buildFeedbackStateSnapshot(state),
      eventType: "feedback",
    });
    finishFeedback(
      "Thanks — you can also contact the library for more help."
    );
  });
}

function journalSupportsNeed(journal, supportType) {
  switch (supportType) {
    case "agreement_lookup":
      // Almost any journal with a deal is relevant
      return Boolean(journal.deal);
    case "fellowship":
      return journal.benefitType === "fellowship";
    case "apc_help":
      // Any journal with a deal or explicit cost info is relevant
      return Boolean(journal.deal || journal.cost_to_author);
    case "cap_limit":
      // Journals where benefit is conditional are most relevant
      return journal.benefitType === "conditional";
    case "discount_code":
      return Boolean(journal.deal?.special_instructions?.length || journal.benefitType === "fellowship");
    case "journal_match":
      // Keep subject-based alternatives focused on actual journals.
      return journal.recordType === "journal" && Boolean(journal.subjectIds.length);
    case "indexing":
      return journal.hasLiveNlmLookup;
    default:
      return true;
  }
}

function dealSupportsNeed(deal, supportType) {
  switch (supportType) {
    case "agreement_lookup":
    case "apc_help":
      return true;
    case "fellowship":
      return Boolean(deal.fellowship_code);
    case "cap_limit":
      return deal.benefitType === "conditional";
    case "discount_code":
      return Boolean(deal.special_instructions.length || deal.fellowship_code);
    case "indexing":
      return true; // indexing is journal-level, so all deals are equally relevant
    default:
      return true;
  }
}

function classifyJournalMatch(journal, state, analysis) {
  if (!analysis.normalized) {
    if (state.subjectId) return "subject-filter";
    if (state.publisherName) return "publisher-filter";
    if (state.benefitType) return "benefit-filter";
    if (state.supportType) return "support-filter";
    return "";
  }

  if (matchesJournalIdentifier(journal, analysis.identifiers)) {
    return "identifier";
  }
  if (journal.titleNormalized === analysis.normalized) {
    return "exact-title";
  }
  if (matchesNormalizedPhrase(journal.titleNormalized, analysis.phraseRegex)) {
    return "title-phrase";
  }
  if (
    matchesNormalizedPhrase(journal.publisherNormalized, analysis.phraseRegex) ||
    analysis.publishers.some((publisher) =>
      publisherMatchesNormalizedText(publisher, journal.searchBlob),
    )
  ) {
    return "publisher";
  }
  if (analysis.subjects.some((subjectId) => journal.subjectIds.includes(subjectId))) {
    return "subject";
  }
  if (matchesAllTerms(journal.searchBlob, analysis.termRegexes)) {
    return "all-terms";
  }
  return "";
}

function classifyDealMatch(deal, state, analysis, matchedDealIds, topicDealIds) {
  if (matchedDealIds.has(deal.deal_id)) {
    return "linked-journal";
  }
  if (topicDealIds.has(deal.deal_id)) {
    return "linked-topic";
  }

  if (!analysis.normalized) {
    if (state.publisherName && normalizeForSearch(deal.publisher) === normalizeForSearch(state.publisherName)) {
      return "publisher-filter";
    }
    if (state.benefitType) return "benefit-filter";
    if (state.supportType) return "support-filter";
    return "";
  }

  if (
    matchesNormalizedPhrase(deal.publisher, analysis.phraseRegex) ||
    analysis.publishers.some((publisher) =>
      publisherMatchesNormalizedText(publisher, deal.searchBlob),
    )
  ) {
    return "publisher";
  }
  if (matchesNormalizedPhrase(deal.searchBlob, analysis.phraseRegex)) {
    return "phrase";
  }
  if (matchesAllTerms(deal.searchBlob, analysis.termRegexes)) {
    return "all-terms";
  }
  return "";
}

function inferSubjectsFromText(text, fallbackToGeneral = false) {
  const normalized = normalizeForSearch(text);
  const matches = SUBJECT_DEFINITIONS.filter((subject) =>
    subject.keywords.some((keyword) =>
      matchesNormalizedText(normalized, keyword),
    ),
  ).map((subject) => subject.id);
  if (matches.length) return uniqueValues(matches);
  return fallbackToGeneral ? ["general-medicine"] : [];
}

function getSubjectLabel(subjectId) {
  return (
    SUBJECT_DEFINITIONS.find((subject) => subject.id === subjectId)?.label ||
    subjectId
  );
}

function getSupportLabel(supportType) {
  return (
    SUPPORT_NEEDS.find((need) => need.id === supportType)?.label ||
    "Support guidance"
  );
}

function buildNlmCatalogUrl(title, issn) {
  const term = issn ? `${issn}[issn]` : `${title}[Title]`;
  return `https://www.ncbi.nlm.nih.gov/nlmcatalog/?term=${encodeURIComponent(term)}`;
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function cleanText(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/â€™/g, "'")
    .replace(/â€œ|â€�/g, '"')
    .replace(/â€“|â€”|âˆ’/g, "-")
    .replace(/Ã©/g, "e")
    .replace(/Ã¡/g, "a")
    .replace(/Ã¤/g, "a")
    .replace(/Ã±/g, "n")
    .trim();
}

function normalizeForSearch(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeIdentifier(value) {
  return cleanText(value).replace(/[^0-9A-Za-z]+/g, "").toUpperCase();
}

function escapeRegex(value) {
  const s = String(value);
  let escaped = "";
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    // If this character is one of the regex specials, prefix it with a backslash
    if (/[.*+?^${}()|[\]\\]/.test(ch)) {
      escaped += "\\" + ch;
    } else {
      escaped += ch;
    }
  }
  return escaped;
}

function buildNormalizedPhraseRegex(value) {
  const normalized = normalizeForSearch(value);
  if (!normalized) return null;
  const pattern = normalized.split(" ").map(escapeRegex).join("\\s+");
  return new RegExp(`(?:^|\\s)${pattern}(?:\\s|$)`, "i");
}

function buildTermRegexes(value) {
  const normalized = normalizeForSearch(value);
  if (!normalized) return [];
  return uniqueValues(normalized.split(" ").filter(Boolean))
    .map((term) => buildNormalizedPhraseRegex(term))
    .filter(Boolean);
}

function buildFeedbackStateSnapshot(state) {
  if (!state) return {};
  return {
    hasQuery: Boolean(state.query),
    queryLength: state.query ? state.query.length : 0,
    subjectId: state.subjectId || "",
    supportType: state.supportType || "",
    benefitType: state.benefitType || "",
  };
}

function matchesNormalizedPhrase(text, regex) {
  const normalized = normalizeForSearch(text);
  return Boolean(regex && normalized && regex.test(normalized));
}

function matchesNormalizedText(text, value) {
  return matchesNormalizedPhrase(text, buildNormalizedPhraseRegex(value));
}

function matchesAllTerms(text, termRegexes) {
  const normalized = normalizeForSearch(text);
  return Boolean(
    normalized &&
      termRegexes.length &&
      termRegexes.every((regex) => regex.test(normalized)),
  );
}

function extractQueryIdentifiers(query) {
  const raw = cleanText(query);
  const issns = uniqueValues(
    (raw.match(/\b\d{4}-?\d{3}[\dXx]\b/g) || []).map(normalizeIdentifier),
  );
  const isbns = uniqueValues(
    (
      raw.match(/\b(?:97[89][-\s]?)?\d(?:[-\s]?\d){8,16}[\dXx]?\b/g) || []
    )
      .map(normalizeIdentifier)
      .filter((identifier) => identifier.length >= 10),
  );
  return { issns, isbns };
}

function matchesJournalIdentifier(journal, identifiers) {
  return (
    identifiers.issns.some(
      (issn) =>
        issn === journal.issnPrintNormalized ||
        issn === journal.issnOnlineNormalized,
    ) ||
    identifiers.isbns.some((isbn) => isbn === journal.isbnNormalized)
  );
}

function matchPublisherEntries(query) {
  const normalized = normalizeForSearch(query);
  if (!normalized) return [];
  return PUBLISHER_DIRECTORY.filter((entry) =>
    publisherMatchesNormalizedText(entry, normalized),
  );
}

function publisherMatchesNormalizedText(publisherEntry, text) {
  return publisherEntry.aliases.some((alias) => matchesNormalizedText(text, alias));
}

function getDirectMatchPriority(matchType) {
  switch (matchType) {
    case "identifier":
      return 0;
    case "exact-title":
      return 1;
    case "title-phrase":
      return 2;
    case "linked-journal":
      return 3;
    case "linked-topic":
      return 4;
    case "publisher":
    case "publisher-filter":
      return 5;
    case "phrase":
      return 6;
    case "subject":
    case "subject-filter":
      return 7;
    case "benefit-filter":
      return 8;
    case "support-filter":
      return 9;
    case "all-terms":
      return 10;
    default:
      return 11;
  }
}

function getSupportMatchPriority(matchType) {
  switch (matchType) {
    case "phrase":
      return 0;
    case "keyword":
      return 1;
    case "support-type":
      return 2;
    case "benefit-type":
      return 3;
    case "all-terms":
      return 4;
    default:
      return 5;
  }
}

function uniqueValues(values) {
  return [...new Set(values.filter(Boolean))];
}

function isValidISSN(issn) {
  return /^[0-9]{4}-[0-9]{3}[0-9Xx]$/.test(issn);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}

function sendFeedbackEvent(payload) {
  fetch(FEEDBACK_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...payload,
      timestamp: new Date().toISOString(),
    }),
    keepalive: true,
  }).catch(() => {
    // Swallow errors: analytics should never break the UI
  });


  // 2) OPTIONAL: Google Analytics / Matomo integration
  // Uncomment and adjust based on your analytics setup.

  /*
  if (window.gtag) {
    // Google Analytics 4 example
    window.gtag("event", "oafinder_feedback", {
      event_category: "OAFinder",
      event_label: payload.mode,
      value: payload.helpful ? 1 : 0,
      subject: payload.stateSnapshot.subjectId,
      supportType: payload.stateSnapshot.supportType,
      benefitType: payload.stateSnapshot.benefitType,
    });
  }

  if (window._paq) {
    // Matomo example
    window._paq.push([
      "trackEvent",
      "OAFinder",
      "Feedback",
      payload.mode,
      payload.helpful ? 1 : 0,
    ]);
  }
  */
}

